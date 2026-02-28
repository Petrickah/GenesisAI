# 🧬 GenesisAI: Krakoa Nexus DSL - Project Context

GenesisAI is a specialized framework designed to mitigate "Contextual Drift" and "Narrative Hallucination" in Large Language Models (LLMs). It achieves "Semantical Determinism" by employing a Domain-Specific Language (DSL) called **Krakoa Nexus DSL**, which uses semantic tokens (emojis) to define immutable, graph-based data structures.

## 🏗️ Project Architecture

The project is structured as a TypeScript-based engine that compiles Krakoa scripts into an Intermediate Representation (IR) for execution.

- **`app/src/grammar/`**: Contains the `grammar.pegjs` file, which defines the DSL's syntax using Peggy.js.
- **`app/src/engine/`**: Core logic for the DSL.
- **`KrakoaCompiler.ts`**: Transforms the AST into a linked, instruction-based IR.
- **`KrakoaRunner.ts`**: A register-based virtual machine that executes the IR.
- **`KrakoaEngine.ts`**: Handles file loading and `esbuild`-based compilation of `.ksl` (Krakoa Script Language) files.
- **`app/src/schema/`**: Defines the data structures using `Zod` for strict validation of the AST and IR.
- **`app/src/ui/`**: Contains the `KrakoaREPL.ts`, providing an interactive console for testing and debugging Krakoa scripts.

## 🛠️ Key Technologies

- **TypeScript**: Main development language.
- **Peggy.js**: Parser generator for the Krakoa Nexus DSL.
- **esbuild**: Used to bundle and transpile `.ksl` scripts at runtime.
- **Zod**: Runtime schema validation.
- **SurrealDB**: (Planned) Vector Knowledge Database for persistent storage.
- **Ollama**: (Integrated) Local LLM orchestration.

## 🚀 Building and Running

Commands should be executed within the `app` directory.

| Command                 | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `npm run build:grammar` | Compiles `grammar.pegjs` into `grammar.cjs`.                 |
| `npm run build`         | Compiles TypeScript source to the `dist` directory.          |
| `npm start`             | Starts the system in REPL mode (`tsx src/index.ts --repl`).  |
| `npm run watch`         | Runs the engine in watch mode for development.               |
| `npm run watch:grammar` | Automatically recompiles the grammar on changes.             |

## 📜 Development Conventions

### Krakoa Script Language (.ksl)

Scripts are written as standard TypeScript files that export a default `k` template literal:

```ts
import { k } from '../engine/KrakoaCompiler.js';

export default k`
👤("WADE", name: "Deadpool") {
  🧩("Merc") 🔑 [#HealingFactor];
}
`;
```

### Semantic Tokens

The DSL uses a specific set of emojis as functional tokens:

- **Structural**: `📑` (Fragment), `🧠` (Concept), `👤` (Entity), `📦` (Collection).
- **Logic**: `🧬` (Logic), `🔓` (Asset), `📌` (State), `🔑` (Tag), `🧩` (Stance).
- **Relational**: `🔗` (Link), `🔱` (Authority), `🤝` (Alliance), `⚔️` (Conflict).
- **Execution**: `➔` (Trigger), `⚓` (Anchor), `📡` (Signal), `💬` (Comm).

### REPL Commands

- `.load <path>`: Load and run a `.ksl` file.
- `.step`: Step through the execution of the loaded program (Debug mode).
- `.print`: Print the current execution context/registers.
- `.exit`: Terminate the session.

## 🗺️ Roadmap Highlights

- **Integration with SurrealDB**: For graph persistence and vector search.
- **LLM Synthesis**: Implementing the "Quiet Council" protocol for multi-agent consensus.
- **Advanced RAG**: Deterministic knowledge retrieval via the `🔗` token.
