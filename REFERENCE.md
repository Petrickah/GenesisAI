# 🧬 GenesisAI: Krakoa Nexus DSL - Master Architectural Reference

This document serves as the final blueprint for the GenesisAI engine, incorporating the **Tcl-style Evolution** and **Deterministic Execution** models.

---

## 🎓 Part 1: Architectural Core & Lessons Learned

The Krakoa Nexus DSL operates as a **Semantic Command Orchestrator**. Every token is an extensible command, and state is managed via a hierarchical environment rather than static memory pointers.

### 1. The Environment (Registers & Stacks)

- **IP (Instruction Pointer):** The index of the current semantic node in the IR.
- **ReturnStack:** Strictly for **Non-Linear Jumps** (Inheritance, Subroutines). Lexical flow (standard blocks) relies on IR `next` pointers.
- **DataStack:** A stack of contextual frames representing the active hierarchy.
- **CSP (Current Structural Pointer):** Points to the nearest **Structural Container** (`👤` Entity or `🧠` Concept). All logic tokens "decorate" this anchor.
- **BSP (Base Stack Pointer):** Points to the root of the current **Logic Scope** (the Trigger `➔` that started the flow).

### 2. Immutable IR (The Fetch Ritual)

- **The Lesson:** The `decode` phase must not modify the original program code.
- **The Fix:** `runner.fetch()` must return a **shallow clone** of the instruction. This prevents text-pooling indices from being permanently replaced by strings, which causes errors during loops.

### 3. Ghost Instructions (Sentinels)

- **The Sentinel (`🏁`):** An internal opcode automatically inserted by the compiler at the end of every body `{ ... }`.
- **Smart Merging:** The Sentinel is the **sole authority** for scope exit. It performs **Hierarchical Nesting** for structural containers and **Flattening** for logic blocks.
- **Cycle Control:** For Triggers, the Sentinel increments cycle counts and sets `IP = bodyAddr` until cycles are exhausted.
- **Non-Trigger Sentinels:** A sentinel for a non-trigger block (like `🧠` or `📑`) is a NO-OP. It does not halt execution but simply allows the runner to proceed to the next instruction.

### 4. Deterministic Flow Control (The Silent Step)

- **The Lesson:** VM auto-incrementing the `IP` can conflict with manual jumps from commands.
- **The Fix:** The runner should only increment the `IP` if the command execution was successful and **did not** manually change the `IP`. Commands can return `false` to "pause" execution without halting the VM.

### 5. Semantic Dispatching

- **Literal Types:** Instruction `type` (emojis) must **never** be string-pooled. They must remain literal strings/emojis to ensure the `CommandTable` lookup always succeeds.
- **Proxy Context:** Lambdas (`λ`) use a proxy that searches the `CSP` chain first, then the `BSP`, then Global Symbols.

### 6. Contextual Integrity (The Trigger State)

- **The Lesson:** Transient triggers (`➔`) operate on the current context (`BSP`). A missing `__activeTriggers` array causes errors.
- **The Fix:** Initialize global context with `__activeTriggers: []`.

### 7. Qualified ID Resolution (The Path Blueprint)

- **The Lesson:** Flat IDs (e.g., `Counter`) cause shadowing collisions when multiple concepts share names.
- **The Fix:** The compiler generates **Qualified IDs** using path-based joining (e.g., `WADE::Health`). The linker resolves all `@References` using these absolute paths, ensuring that inheritance links always point to the correct "DNA" source.

### 8. Procedural Inheritance (The Constructor Model)

- **The Lesson:** Inheritance isn't just a data copy; it's an execution event.
- **The Fix:** Use `handleLink` to perform a **Constructor Jump** to the target. Push a staging context, execute the parent's instructions, and then merge the results back into the agent via the `🏁` (Sentinel). This allows inheritance to be reactive.
- **The Caveat (Reference Sharing):** Currently, concepts are shared by reference. Writing to an inherited concept can "mutate the DNA" of the parent. Future versions may require Prototypal (`Object.create`) or Deep Cloning strategies.

### 9. Grammar & Type Alignment

- **Numbers:** `NumberLiteral` now supports optional negative signs (`-?[0-9]`).
- **Lambdas:** The standard internal type for functional blocks is `:lambda` (not `λ`). This ensures compatibility between the Peggy parser and the `KrakoaEvaluator`.

---

## 🗺️ Part 2: Master Implementation Roadmap

### Phase 1: Compiler Intelligence

- [x] **Literal Types:** Update `process()` in `KrakoaCompiler.ts` to skip string-pooling for the `type` key.
- [x] **Sentinel Insertion:** Append a `🏁` instruction at the end of every block body.
- [x] **Sentinel Metadata:** Include `params.nest` (boolean) and `params.bodyAddr` (number, for triggers only).
- [x] **Next Linkage:** Ensure the sentinel's `next` points to the address of the next instruction after the block.

### Phase 2: VM Stability

- [x] **Cloned Fetch:** Refactor `runner.fetch()` to return `{ ...currInstruction }`.
- [x] **Selective Decode:** Update `runner.decode()` to return literal strings if the key name is `type`.
- [x] **Silent Step:** Update `runner.step()` to prevent auto-increment if `IP` was manually changed or if `execute()` returned `false`.
- [x] **Reset Fix:** Assign properties to `this.Registers` individually to preserve the object reference.
- [x] **Global Context:** Initialize `DataStack` with `__activeTriggers: []`.
- [x] **Qualified IDs:** Generate path-joined identifiers in the compiler level.

### Phase 3: Stateless Opcodes

- [x] **Sentinel (`Sentinel.ts`):** Implemented merging logic and ReturnStack-based flow control.
- [x] **Trigger (`Trigger.ts`):** Implemented persistent entity frames and transient trigger lists.
- [x] **Contextual (`Contextual.ts`):** Added support for `🧠` (Concept) nesting and `📌` (State) updates.
- [x] **Inheritance (`Inheritance.ts`):** Implemented staging context and constructor jumps via `handleLink`.

### Phase 4: Validation

- [x] **Integration Test:** `loop.test.ts` passing with full inheritance and update logic.
- [x] **Final Cleanup:** Removed debug logs and validated instruction linkage.

---

## 🔬 Part 3: Current Status & Next Steps

The primary engine features (Inheritance, Scoping, Merging, and Cycles) are now **stable and verified**. The `loop.test.ts` passes with a 100% success rate. 

- **Next Goal:** Persistent Storage Integration. As highlighted in architectural lesson #8, the current in-memory reference sharing works for transient runs but will need a **Copy-on-Write** strategy for long-term agent persistence in SurrealDB to avoid "DNA contamination."
