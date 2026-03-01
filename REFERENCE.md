# 🧬 GenesisAI: Krakoa Nexus DSL - Architectural Reference

This document serves as a reference for the intended execution model of the Krakoa Nexus DSL, focusing on **Semantical Determinism** and **Hierarchical Context Management**.

## 🏗️ Virtual Machine & Stack Management

The `KrakoaRunner` acts as a register-based VM. The core of its state is the **DataStack**, which manages nested execution frames.

### 📍 Key Registers

- **IP (Instruction Pointer):** Points to the current instruction index in the flattened IR.
- **ESP (Extended Stack Pointer):** Points to the top of the `DataStack`.
- **BSP (Base Stack Pointer):** Points to the **Logic Scope** (the Trigger `➔` that initiated the current execution branch).
- **CSP (Current Structural Pointer):** Points to the nearest **Structural Container** (`👤` Entity or `🧠` Concept). This allows logic tokens to find their "parent" container even when nested inside deep logic branches.

---

## 🔣 Token Categorization

Tokens are divided into two functional roles during execution:

### 1. Structural Containers (`👤`, `🧠`, `📑`, `📦`, `🔓`)

- **Behavior:** When encountered, these tokens **push a new frame** onto the `DataStack`.
- **Persistence:** `👤` (Entity) triggers create "Persistent" frames that remain on the stack until a `:halt` signal. Others are "Transient".
- **Return Logic:** Upon exit, these frames are **nested** under their `ID` in the parent frame, preserving the hierarchy.

### 2. Logic & Property Tokens (`🧬`, `📌`, `🧩`, `⚓`, `📡`, `💬`)

- **Behavior:** If they have a body (nested code), they push a transient frame. If they are "leaves" (no body), they **decorate** the current Structural Container (`CSP`).
- **Resolution:** `📌` (State) and `📂` (Data) are treated as raw value accessors (e.g., `ctx["Health"]` returns the value directly).
- **Return Logic:** Upon exit, logic frames are **flattened** (merged) into their Structural Parent to keep the object model clean.

---

## 🔗 Inheritance & Absorption

Inheritance is a dynamic process that occurs during a jump:

1. **Jump:** The VM moves the `IP` to the target address.
2. **Absorption:** The VM "peeks" into the target's body. It recursively evaluates properties and containers at the target and **merges** them into the caller's frame *before* the caller continues its own logic.
3. **Context Switching:** When jumping to a tag (e.g., `@"WADE_BASE"`), the VM optionally uses that tag as a reference for **Context Switching** in Lambda evaluations.

---

## ƛ Lambda Evaluation (`evalLambda`)

Lambdas (`λ`) use a **Proxy Context** to resolve variables in a specific order:

1. **Local Frame:** Check the current execution frame.
2. **Structural Parent (`CSP`):** Check the container the logic belongs to.
3. **Logic Base (`BSP`):** Check the trigger that started the flow.
4. **Global Symbols:** Check the root of the knowledge base.
5. **Tags:** If the instruction has `🔑` tags, resolve references from those tags into the context.

---

## ➔ The Trigger Lifecycle

Triggers manage the lifecycle of an execution branch:

- **Entry:** Set the `BSP` and `CSP` to the trigger frame.
- **Branching:** Triggers with multiple tags (via `🔗`) cycle through addresses until all branches are exhausted or a return is hit.
- **Exit (Smart Merge):**
  - If `ESP > BSP`: Pop remaining children and nest/flatten them based on their `__isStructural` flag.
  - Restore `IP` to the return address stored in the trigger frame.
  - Restore `BSP` and `CSP` to the parent's values.

---

## 🛠️ Refinement & Implementation Checklist

To align the current codebase with this reference, the following refinements are required:

### 1. Register Synchronization

- [ ] **Add `CSP` Register:** Update `KrakoaRunner.ts` to include the `CSP` (Current Structural Pointer).
- [ ] **Track Structural Parent:** Ensure `Contextual.ts` updates `CSP` only when a Structural Container is pushed.

### 2. Smart Contextual Logic (`Contextual.ts`)

- [ ] **Role-Based Branching:** Differentiate between Structural (push frame) and Logic (decorate `CSP`).
- [ ] **Transparent Logic Frames:** If a Logic token has a body, it should push a frame marked `__isStructural: false` to facilitate flattening upon return.
- [ ] **Leaf Decoration:** Properties without bodies should merge directly into the frame at `CSP`.

### 3. Hierarchical Absorption (`Inheritance.ts`)

- [ ] **Recursive Nesting:** Update `absorbFromTarget` to preserve the structure of the inherited target (nesting containers instead of flattening everything).
- [ ] **Context Injection:** Support passing `tags` to `evalLambda` during inheritance to allow the inherited logic to "see" the caller's context.

### 4. Advanced Lambda Resolution (`KrakoaEvaluator.ts`)

- [ ] **CSP-Aware Lookup:** Update `findInStack` to prioritize the `CSP` chain over the `BSP` chain for structural property resolution.
- [ ] **Tag-Based Context:** Implement the ability to craft a `customContext` from reference tags before executing the lambda function.

### 5. Deterministic Exit (`Trigger.ts`)

- [ ] **Smart Merge:** Update the exit phase to check `__isStructural`. If true, nest the frame under its ID; if false, flatten its contents into the parent.
- [ ] **Root Protection:** Ensure the Global Context (Frame 0) remains a flat key-value store for accessibility while still supporting nested children.

---

## 👻 Ghost Instructions (Compiler Sentinels)

To avoid "Magic Logic" in the VM and ensure **Semantical Determinism**, the compiler can emit "Ghost Instructions" (Sentinels) that handle scope management and return logic explicitly. This transforms implicit VM behavior into explicit, programmable IR.

### 🏁 Internal Opcodes

- **`EXIT_SCOPE` (NEST/FLATTEN):**
  - **Purpose:** Automatically appended by the compiler at the end of every `{ ... }` block.
  - **Logic:** Decides between **Hierarchical Nesting** (for Structural Containers) and **Flattening** (for Logic Tokens) based on a `nest: boolean` flag in the instruction params.
  - **Execution:**
      1. **Merge:** Nest the frame under its ID if `nest` is true; otherwise, flatten (Object.assign) into the parent.
      2. **Pop Frame:** Remove current frame from `DataStack`.
      3. **Flow Control:** If `ReturnStack` is not empty, `IP = ReturnStack.pop()`. Otherwise, `IP = Trigger.__retAddress`.
      4. **Sync Registers:** Update `ESP`, `BSP`, and `CSP` to reflect the new top frame.

- **`SUBROUTINE_RETURN`:**
  - Same logic as `EXIT_SCOPE`, but used for explicit user-defined returns (`🔗` mode: "Return"). It essentially acts as a manual trigger for the sentinel logic.

### 🏗️ Runtime: The Return Stack

A dedicated `ReturnStack` in the `KrakoaRunner` manages **Non-Linear Flow** (Jumps/Calls).

1. **Normal Flow:** Instructions proceed via `next[0]`. No stack interaction is needed.
2. **The Jump (`🔗`):** When jumping to a tag/subroutine, the VM **pushes** the *next address* (where execution should resume after the subroutine) onto the `ReturnStack`.
3. **The Return (`🏁`):** The Ghost instruction at the end of the target code **pops** from the `ReturnStack` to find its way back.

### 🗑️ Obsolete Metadata (Flags to Remove)

With the introduction of the `ReturnStack` and `Ghost Instructions`, the following can be deprecated:

- **`__retAddress` (in frames):** Only Triggers need to store a "fail-safe" exit address. All dynamic returns are handled by the `ReturnStack`.
- **`__isExecuting`:** No longer needed as the IP and ReturnStack manage the active path.
- **`Implicit Return Guessing`:** The VM no longer needs to check instruction indices to guess when a scope ends.

### 🛠️ Ghost Instruction TODO List

- [ ] **Compiler Epilogues:** Update `KrakoaCompiler.ts` to push an internal "Exit" node (type `🏁`) after processing a node's body.
- [ ] **Instruction Params:** Ensure the `🏁` instruction has a `nest` parameter (`true` for `👤/🧠`, `false` for `🧬`).
- [ ] **Return Stack:** Implement `ReturnStack: number[] = []` in `KrakoaRunner.ts`.
- [ ] **The Jump Logic:** Update `Inheritance.ts` to push the next address to the `ReturnStack` before setting the `IP`.
- [ ] **The Ghost Handler:** Implement the unified opcode handler for `🏁` (Merge -> Pop -> Return -> Sync).
