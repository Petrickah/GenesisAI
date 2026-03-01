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
