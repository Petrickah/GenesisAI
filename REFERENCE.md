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

- **The Lesson:** Transient triggers (`➔` without a persistent `👤` entity) operate on the current context (`BSP`). If a trigger is at the global scope, it decorates the global context (`DataStack[0]`). Sentinels for these triggers also need to check this context. A missing `__activeTriggers` array on the global context causes runtime errors when a sentinel is encountered.
- **The Fix:** The `KrakoanRunner`'s `reset()` method must initialize the global context with `__activeTriggers: []`. This guarantees that transient triggers and their corresponding sentinels have a stable state array to work with from the start of execution.

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
- [x] **Global Context:** Initialize `DataStack` with `__activeTriggers: []` in the global context to support transient triggers.

### Phase 3: Stateless Opcodes

- [ ] **Sentinel (`Sentinel.ts`):**
  - [ ] Logic for Hierarchical Merge (Nest vs Flatten).
  - [ ] Logic for Trigger cycles (use `bodyAddr`).
  - [ ] Flow Control (Check `ReturnStack` first, then lexical `node.next`).
- [ ] **Trigger (`Trigger.ts`):**
  - [ ] Initial entry frame setup.
  - [ ] Robust re-entry check: Search stack for existing `__address` and set `BSP`.
- [ ] **Contextual (`Contextual.ts`):**
  - [ ] Container vs Leaf logic.
  - [ ] Push `node.next` (the sentinel/sibling) to `ReturnStack` before entering a block.
- [ ] **Inheritance (`Inheritance.ts`):**
  - [ ] Refactor recursive absorption to anchor data at the `CSP`.
  - [ ] Push return address to `ReturnStack` before jumping to target.

### Phase 4: Validation

- [ ] **Integration Test:** Verify a multi-cycle triggered entity (`👤` + `➔` + `🔗`) produces a clean, non-redundant JSON result.
- [ ] **Final Cleanup:** Remove all deprecated flags (`__retAddress` inside frames, `__isExecuting`, etc.).

---

## 🔬 Part 3: Current Status & Next Steps

The core VM stability and compiler intelligence are largely complete. The primary remaining test failure (`loop.test.ts`) is expected and serves as a driver for the next phase of development.

- **`loop.test.ts` Failure:** This test fails because the structural (`🧠`) and state (`📌`) opcodes are not yet implemented. The runner executes them as NO-OPs, so the `Counter` variable in the test program is never initialized or incremented. The test's failure (`expected: 3, actual: undefined`) correctly confirms that this logic is the next to be implemented as part of Phase 3.
