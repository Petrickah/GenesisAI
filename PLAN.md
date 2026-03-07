# 🧬 GenesisAI: Strategic Roadmap (The Identity Phase)

This document outlines the evolution of the GenesisAI framework, moving from a complex VM-based execution to a streamlined **Identity Matrix & Behavior Tree** architecture.

## 📊 Current State: Phase 1 (Parser & Logic Foundation)
The core grammar and semantic parsing of the Krakoa Nexus DSL are fully operational.

### ✅ Completed Milestones
- **DSL Grammar (`Peggy.js`)**: Lexicon and semantic token parsing are finalized.
- **AST Generation**: Successfully transforming `.ksl` scripts into structured JSON trees.
- **Legacy VM Research**: Proved that a register-based VM is over-engineered for LLM orchestration; lessons learned are now being distilled into the Transpiler.

---

## 🗺️ The New Frontier: Strategic Roadmap

### Phase 2: The Identity Matrix (Week 3 - Transpilation)
*Goal: Transform ASTs into dense, structured JSON Bulletins for LLM Anchoring.*

1. **The Flattener (Transpiler)**:
   - [ ] Implement `KrakoaTranspiler.ts` to convert recursive ASTs into linear "Identity Matrices".
   - [ ] Implement **Behavior Tree (BT)** traversal logic: Evaluating `⚓` (Anchors) as guards for branch execution.
2. **Deterministic Identity**:
   - [ ] Define the JSON schema for "Agent Identity" (Traits, Logic, Stance).
   - [ ] Implement `🔗` (Inheritance) as a **Deep Merge** operation during transpilation.

### Phase 3: The Intelligence (Week 4 - AI Orchestration)
*Goal: Bridge the Identity Matrix with local LLM (Ollama) execution.*

1. **Identity Injection**:
   - [ ] Develop System Prompts that treat the Identity Matrix as the "Source of Truth" (SSOT).
   - [ ] Test **Contextual Anchoring** to ensure Ollama stays in character within 8k context windows.
2. **Behavioral Ticks**:
   - [ ] Implement the "Tick" cycle: The AI evaluates its logic tree before generating a response.

### Phase 4: The Ledger (Beyond Week 4 - Persistence)
*Goal: Store identities as persistent nodes in a Knowledge Graph.*

1. **SurrealDB Integration**:
   - [ ] Map Entities and Concepts to SurrealDB Graph nodes.
   - [ ] Implement "Identity Retrieval": Fetching an agent's pre-compiled JSON matrix from the database.
2. **Lore Governance**:
   - [ ] Use the Vector Database to provide real-time RAG updates to the Identity Matrix.

---

## 🛠️ Immediate Next Steps
- [ ] **Scrap Legacy VM**: Archive `KrakoaRunner.ts` and focus on `KrakoaTranspiler.ts`.
- [ ] **Identity Prototype**: Create the first "Identity Bulletin" for `Deadpool.ksl`.
- [ ] **Ollama Benchmarking**: Verify if JSON-density prevents "Narrative Drift" in 8B models.
