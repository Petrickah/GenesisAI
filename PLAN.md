# Krakoan VM Architecture Implementation Plan

## Current State

- **Functional Components:**
  - KrakoaRunner.ts: Script execution and REPL integration
  - KrakoaCompiler.ts: Compiles Krakoan DSL to intermediate representation
  - Basic Opcodes: Trigger, Inheritance (partial)
  - Database: SurrealDB connection and schema

- **Missing Components:**
  - Speech opcode (➔ communication)
  - Complete Trigger-Commit rule implementation
  - Logic opcodes (if/else equivalents)
  - Vector DB persistence for nodes
  - LLM integration as 'Brain' opcode

- **Memory Model:**
  - BSP (Base Stack Pointer) implementation
  - ESP (Stack Pointer) management
  - Frame-based execution model

## Phase 1: Stabilization

**Goal:** Establish core execution stability with proper stack management and error handling

### Tasks for phase 1

1. **Speech Opcode Implementation**
   - Create `app/src/engine/opcodes/Speech.ts`
   - Implement `executeSpeech` function with async support
   - Register in `KrakoaEngine.ts`
   - Handle communication tokens: `💬`, `📡`

2. **Inheritance Opcode Refinement**
   - Complete Trigger-Commit rule implementation
   - Ensure BSP/ESP interactions follow semantic determinism
   - Add proper frame merging logic

3. **Error Handling Framework**
   - Implement stack trace capture
   - Add execution context validation
   - Create error recovery mechanisms

## Phase 2: Logic & Data

**Goal:** Implement core logic operations and data persistence

### Tasks for phase 2

1. **Logic Opcodes**
   - Implement conditional execution (if/else equivalents)
   - Add comparison operators
   - Create loop constructs

2. **Vector DB Integration**
   - Complete node persistence for all entities
   - Implement relationship storage
   - Add query capabilities

3. **Data Flow Validation**
   - Type checking for stack operations
   - Memory safety guarantees
   - Frame isolation verification

## Phase 3: Agentic Behavior

**Goal:** Create intelligent agent capabilities

### Tasks for phase 3

1. **LLM Integration**
   - Create 'Brain' opcode interface
   - Implement vector database querying
   - Add reasoning capabilities

2. **Memory Augmentation**
   - Connect working memory to vector DB
   - Implement memory persistence
   - Add learning capabilities

3. **Agentic Control Flow**
   - Implement goal-directed execution
   - Add planning capabilities
   - Create self-modification hooks

## Checklist

### Checklist Phase 1: Stabilization

- [x] ✅ Speech opcode implemented
- [x] ✅ Inheritance opcode refined with Trigger-Commit rule
- [x] ✅ Basic error handling framework
- [x] ✅ Stack management validation

### Checklist Phase 2: Logic & Data

- [ ] Logic opcodes implemented
- [ ] Vector DB persistence complete
- [ ] Data flow validation system

### Checklist Phase 3: Agentic Behavior

- [ ] LLM 'Brain' opcode integrated
- [ ] Memory augmentation complete
- [ ] Agentic control flow implemented

## Technical Standards

- All opcodes follow async state machine pattern
- Stack operations maintain semantic determinism
- Trigger-Commit rule strictly enforced
- Memory model preserves BSP/ESP invariants
- Error handling follows defensive programming principles

## Implementation Notes

- Use Krakoan token syntax for all operations
- Maintain backward compatibility with existing scripts
- Follow existing code style and conventions
- All changes must pass test suite

## References

- CLAUDE.md: Core architecture specifications
- README.md: Krakoan DSL token definitions
- grammar.pegjs: Syntax rules for new opcodes
- KrakoaEngine.ts: Core execution framework
