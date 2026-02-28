# 🧬 GenesisAI Development Roadmap (Genesis Phase)

This document outlines the current state of the GenesisAI framework and the strategic plan for the upcoming development cycles.

## 📊 Current State: Phase 1 (Ingestion & Architecture)

As of late February 2026, the core infrastructure of the Krakoa Nexus DSL is operational.

### ✅ Completed Milestones

- **DSL Grammar (`Peggy.js`)**: Lexicon and semantic token parsing are finalized.
- **Compiler (`KrakoaCompiler.ts`)**: AST to IR transformation, including symbol mapping and reference linking, is stable.
- **Runner/VM (`KrakoaRunner.ts`)**: Register-based VM capable of executing instructions and handling execution contexts.
- **Interactive REPL**: Debugger window, step-through execution, and snippet support are available.
- **Hot-Reloading Environment**: `tsx` and `chokidar` integrated for rapid development cycles.

### 🏗️ In Progress

- **Opcode Expansion**: Implementing the full "Cypher Codex" logic within the VM. Currently, `➔` (Trigger), `👤` (Entity), `🧠` (Concept), `🧬` (Logic), and `💬`/`📡` (Speech/Signal) have active handlers. Opcodes like `📌` (State), `⚓` (Anchor), `🔗` (Inheritance - partial), and `🔃` (Jump) are currently missing full execution logic.
- **VM Refinement**: The register-based execution model and stack frame management (including the `__isExecuting` implicit return logic) are finalized.
- **Semantic Validation**: Deep reference checking in the compiler is active but needs stress testing for circular dependencies and complex graph paths.
- **Watcher Fix**: The `KrakoaWatcher.ts` currently looks for `.kts` files while the engine and programs use `.ksl`.

---

## 🗺️ The Next Frontier: Strategic Roadmap

### Phase 2: The Ledger (Week 3 - Database & Persistence)

*Goal: Transform ephemeral execution into persistent graph-based knowledge.*

1. **SurrealDB Integration**:
    - Deploy SurrealDB via Docker.
    - Establish an active connection between the `KrakoaRunner` and SurrealDB.
2. **Graph Linking Logic**:
    - Implement `🔗` (Inheritance) directly in SurrealQL to allow dynamic property inheritance at the database level.
    - Map `👤` (Entity) and `🧠` (Concept) nodes to persistent SurrealDB records.
3. **The "Ledger" Implementation**:
    - Store every execution state and relationship in a Vector Knowledge Database.
    - Implement "Ancestral Retrieval": Fetching an agent's traits by traversing its inheritance graph.

### Phase 3: The Intelligence (Week 4 - AI Orchestration)

*Goal: Bridge the DSL IR with LLM execution.*

1. **System Prompt Engineering**:
    - Develop "Master Prompts" that instruct the LLM to interpret the DSL's Intermediate Representation (IR).
    - Define the output schema for LLMs to respond in JSON objects mapping back to the DSL logic.
2. **Closed-Loop Interaction**:
    - Implement the `Prompt -> DSL IR -> Context RAG -> Answer` loop.
    - Test multi-agent interaction using the "Quiet Council" protocol (consensus-based synthesis).
3. **Local LLM Integration**:
    - Fully utilize the `ollama` dependency to run models locally, ensuring data privacy and "Semantical Determinism".

### Phase 4: The Librarian (Beyond Week 4 - Advanced RAG)

*Goal: Multimodal ingestion and automated lore governance.*

1. **Multimodal Pipeline**:
    - Integrate `Docling` for hierarchical PDF/HTML ingestion into the Knowledge Vault.
    - Implement the `:ingest` command for dynamic web acquisition (Browserless/Puppeteer).
2. **Contextual Anchoring**:
    - Fine-tune the "Deterministic Fetch" logic where the VM triggers semantic searches based on `⚓` (Anchor) conditions.
3. **Reality Anchors Validation**:
    - Implement automated checks to ensure LLM outputs do not violate the "Immutable Logic" defined in the Krakoan scripts.

---

## 🗺️ One month Roadmap (The Genesis Phase)

### **1st Week: Defining the lexicon and grammar**

- [x] Configuring the development environment (Node.js + TypeScript + Docker + Ollama)
- [x] Finalizing the DSL Specification (The Cypher Codex)
- [x] Implementing the parser using a Pushdown Automaton (PDA/PEG/Peggy.js) using TypeScript.

### **2nd Week: The Parsing Engine (The Compiler)**

- [x] Compiling the tokens into JSON structured objects for a runner.
- [x] The syntactic validation of the `.ksl` scripts.
- [/] Building the Virtual Machine for executing Krakoan Scripts (Core operational, but opcodes are still in development).

### **3rd Week: Integrating with a Vector Knowledge Database (The Ledger)**

- [ ] Building the active connection between the Parser and the Database.
- [ ] Implementing the "Inheritance" logic and "Graph Linking" directly into SurrealQL.
- [ ] Testing the first complex entities (Anran & Wuyang) with persistent relationships.

### **4th Week: AI Interface (The Intelligence)**

- [ ] Writing the "System Prompts" and "Master Prompts" to instruct the LLM to adapt their answers based on the Krakoa Nexus DSL definitions.
- [ ] Writing the "System Prompts" and "Master Prompts" to instruct the LLM to write JSON Objects based on the Intermediate Representation (IR) of Krakoa Nexus DSL.
- [ ] Testing the first close loop: Prompt -> DSL IR -> Context RAG -> Answer.
- [ ] Testing the first interaction with an AI Agent.

---

## 🛠️ Immediate Next Steps (Action Items)

- [ ] **VM Opcodes**: Implement execution logic for `📌` (State), `⚓` (Anchor), `🔃` (Jump), and full `🔗` (Inheritance).
- [ ] **Persistence**: Initialize the `docker-compose.yml` with SurrealDB and update `package.json` scripts for DB migration.
- [ ] **Documentation**: Update the Cypher Codex with the final technical specifications for each opcode's runtime behavior.
- [ ] **Watcher Fix**: Correct the file extension logic in `KrakoaWatcher.ts`.
