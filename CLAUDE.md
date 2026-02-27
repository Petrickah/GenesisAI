# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 1. Project Mission: Krakoan DSL Virtual Machine

### Core Architecture

GenesisAI implements a **Krakoan DSL Virtual Machine** that compiles and executes a custom domain-specific language (DSL) inspired by Marvel's Krakoa mythology and Wuxing cosmology. The system enforces **semantic determinism** through:

- **Structured Tokens**: A lexicon of semantic tokens (e.g., `🧬` for logic, `🔗` for relationships) that define entities, properties, and behaviors
- **Immutable Graph Database**: All entities and relationships are stored as persistent nodes in a vector knowledge database
- **Trigger-Based Execution**: A custom virtual machine that processes triggers (`➔`) as entry points for logical flows

### Key Principles

- **No Standard x86/JS Patterns**: This VM uses custom stack management and execution semantics
- **Trigger-Commit Rule**: Triggers (`➔`) handle stack operations (push/pop/merge) and act as execution anchors
- **Memory Model**:
  - **BSP (Base Stack Pointer)**: Frame anchor for inheritance and scope resolution
  - **ESP (Stack Pointer)**: Grows upward for new frames and local variables

---

## 2. Memory Standards: VM Execution Model

### Stack Management

- **BSP (Base Stack Pointer)**:
  - Anchors the current execution frame
  - Used for inheritance resolution and scope lookup
  - **Immutable during execution**: Cannot be modified while the frame is active
  - **Restored after execution**: When the frame completes (via pop operation), the BSP is restored to its original state (postamble behavior)
  - Acts as the parent frame location for commit operations

- **ESP (Stack Pointer)**:
  - Grows upward (higher addresses) for new frames
  - Tracks local variables and temporary values
  - Managed by the `KrakoaEngine` during trigger execution

### Trigger-Commit Rule

- **Triggers (`➔`)**:
  - Entry points for logical flows
  - Handle stack operations:
    - **Push**: New frame creation (ESP increment)
    - **Pop**: Frame destruction (ESP decrement)
    - **Commit**: Physical merge operation where ALL contents from the child frame are moved into the parent frame (located at the BSP). This is a destructive operation that permanently transfers variables, state, and logic from the child to the parent frame.
  - Must be explicitly declared in Krakoan scripts

---

## 3. Development Guide: Adding Opcodes

### Location

All opcodes are defined in `app/src/engine/opcodes/` and registered in `app/src/engine/KrakoaEngine.ts`.

### Standards

1. **Async Nature**:
   - The engine is an Async State Machine.
   - Opcodes must upport async/await to yield control and allow I/O operations reflect stack changes.
   - Use `Promise`-based implementations

2. **Map Registration**:
   - Opcodes register themselves in the `opcodeMap` in `KrakoaEngine.ts`
   - Format: `{ opcodeName: { execute: function, description: string } }`

3. **Naming Conventions**:
   - **File Naming**: PascalCase (e.g., `Inheritance.ts`, `Trigger.ts`)
   - **Function Naming**: `execute{OpcodeName}` (e.g., `executeTrigger`, `executeInheritance`)
   - **Parameter Handling**: Use destructured objects for clarity

### Example Structure

```typescript
// app/src/engine/opcodes/Trigger.ts
export async function executeTrigger(ctx: ExecutionContext, params: TriggerParams) {
  // Implementation
  return { /* result */ }
}
```

---

## 4. Build & Run Commands

### Package.json Scripts

| Command               | Description                          | Usage                         |
|-----------------------|--------------------------------------|-------------------------------|
| `npm run build`       | Compiles TypeScript to JS            | `npm run build`               |
| `npm run lint`        | Runs ESLint for code quality         | `npm run lint`                |
| `npm run test`        | Runs all tests                       | `npm run test`                |
| `npm run test:watch`  | Runs tests in watch mode             | `npm run test:watch`          |
| `npm run dev`         | Starts development server            | `npm run dev`                 |
| `npm run start`       | Starts production server             | `npm run start`               |

### Common Development Workflow

1. **Build**: `npm run build`
2. **Lint**: `npm run lint --fix`
3. **Run Tests**: `npm run test` or `npm run test:watch`
4. **Single Test**: `npx jest path/to/test/file.test.ts`
5. **Debug**: Use `console.log` with `DEBUG=*` environment variable

---

## 5. Project Map: Key Files

### Core Engine

| File                               | Purpose                                                          |
|------------------------------------|------------------------------------------------------------------|
| `app/src/engine/KrakoaEngine.ts`   | VM core: opcode execution, stack management, trigger handling    |
| `app/src/engine/KrakoaRunner.ts`   | Entry point for script execution and REPL integration            |
| `app/src/engine/KrakoaCompiler.ts` | Compiles Krakoan DSL to intermediate representation              |
| `app/src/engine/KrakoaWatcher.ts`  | Watches for script changes and triggers recompilation            |

### Opcodes

| File                                    | Purpose                                                     |
|-----------------------------------------|-------------------------------------------------------------|
| `app/src/engine/opcodes/Trigger.ts`     | Handles `➔` triggers and stack operations                   |
| `app/src/engine/opcodes/Inheritance.ts` | Manages inheritance and BSP/ESP interactions                |

### Grammar & Parsing

| File                            | Purpose                                                          |
|---------------------------------|------------------------------------------------------------------|
| `app/src/grammar/grammar.pegjs` | PEG.js grammar definition for Krakoan DSL                        |
| `app/src/grammar/grammar.d.ts`  | TypeScript types for parsed grammar                              |

### Database

| File                            | Purpose                                                          |
|---------------------------------|------------------------------------------------------------------|
| `app/src/database/connect.ts`   | Database connection logic (SurrealDB)                            |
| `app/src/database/schema.surql` | SurrealQL schema for knowledge graph storage                     |
| `app/src/database/deploy.ts`    | Schema deployment and migration logic                            |

### Programs & Examples

| File                            | Purpose                                                          |
|---------------------------------|------------------------------------------------------------------|
| `app/src/programs/Deadpool.ksl` | Example Krakoan script (Wade Wilson agent)                       |

### UI & REPL

| File                          | Purpose                                                            |
|-------------------------------|--------------------------------------------------------------------|
| `app/src/ui/KrakoaREPL.ts`    | Interactive REPL for Krakoan DSL execution                         |

### Schema & Types

| File                              | Purpose                                                        |
|-----------------------------------|----------------------------------------------------------------|
| `app/src/schema/krakoa.schema.ts` | TypeScript types for Krakoan entities and relationships        |

### Entry Point

| File                          | Purpose                                                            |
|-------------------------------|--------------------------------------------------------------------|
| `app/src/index.ts`            | Main entry point, initializes engine and database                  |

---

## 6. Krakoan DSL Overview

### Token Categories (from README.md)

1. **Structural Tokens**: `📑`, `🧠`, `👤`, `📦` (entities, concepts, collections)
2. **Logic & Property Tokens**: `🧬`, `🔓`, `📌`, `🔑`, `🧩`, `⌛` (abilities, assets, states, tags)
3. **Relational Tokens**: `🔗`, `🔱`, `🤝`, `⚔️` (links, authority, alliances, conflicts)
4. **Execution Tokens**: `➔`, `⚓`, `📡`, `💬` (triggers, anchors, signals, communication)

### Example Workflow

1. **Parse**: Krakoan script → AST (using `grammar.pegjs`)
2. **Compile**: AST → Intermediate Representation
3. **Execute**: VM processes triggers (`➔`) with stack management
4. **Persist**: Results stored in vector knowledge database

---

## 7. Testing Guidelines

### Test Structure

- Tests are located in `__tests__/` directories
- Use Jest for testing
- Follow the pattern: `test-{feature}.ts`

### Common Test Patterns

1. **Opcode Tests**: Verify individual opcode behavior
2. **Integration Tests**: Test script execution from start to finish
3. **Database Tests**: Verify schema and query correctness

### Running Tests

- `npm run test`: Run all tests
- `npm run test:watch`: Watch mode for development
- `npx jest path/to/test`: Run specific test file

---

## 8. File Naming Conventions

| Extension  | Purpose                          | Example                          |
|------------|----------------------------------|----------------------------------|
| `.ts`      | TypeScript source files          | `KrakoaEngine.ts`                |
| `.ksl`     | Krakoan DSL scripts              | `Deadpool.ksl`                   |
| `.pegjs`   | PEG.js grammar files             | `grammar.pegjs`                  |
| `.d.ts`    | TypeScript type declarations     | `grammar.d.ts`                   |
| `.surql`   | SurrealQL schema files           | `schema.surql`                   |

---

## 9. Import Paths

All imports use `.js` extension (as per `tsconfig.json`):

```typescript
import { KrakoaEngine } from '../engine/KrakoaEngine.js';
```

---

## 10. Key Development Tasks

1. **Adding New Opcodes**:
   - Create file in `app/src/engine/opcodes/`
   - Implement `execute{OpcodeName}` function
   - Register in `KrakoaEngine.ts`

2. **Extending Grammar**:
   - Modify `grammar.pegjs`
   - Update `grammar.d.ts` types
   - Rebuild grammar: `npm run build:grammar`

3. **Database Schema Changes**:
   - Modify `schema.surql`
   - Update `krakoa.schema.ts`
   - Run migrations: `npm run db:migrate`

4. **Adding Example Scripts**:
   - Create `.ksl` files in `app/src/programs/`
   - Update `KrakoaRunner.ts` to include new examples

---

## 11. Debugging Tips

- Use `DEBUG=*` environment variable for verbose logging
- Check `KrakoaEngine.ts` for stack trace handling
- Use `KrakoaREPL.ts` for interactive debugging
- Database queries can be inspected in `connect.ts`

---

## 12. Security Considerations

- **No Sensitive Data**: Never commit API keys or credentials
- **Input Validation**: All opcodes must validate inputs
- **Database Security**: Use SurrealDB's built-in security features
- **Script Sandboxing**: Krakoan scripts run in isolated VM context

---

## 13. Future Work

- **Additional Opcodes**: More execution tokens and logic operators
- **Optimized Parsing**: Faster grammar processing
- **Enhanced REPL**: Better debugging and introspection
- **Vector DB Integration**: Advanced knowledge graph queries

---

## 14. References

- **DSL Specification**: `README.md` (Cypher Codex section)
- **Example Scripts**: `app/src/programs/`
- **VM Core**: `app/src/engine/KrakoaEngine.ts`
- **Database Schema**: `app/src/database/schema.surql`

---

## End of CLAUDE.md

This document is the single source of truth for working with the GenesisAI/Krakoan DSL codebase. All future development should adhere to these standards.
