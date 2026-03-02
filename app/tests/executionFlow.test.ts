import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { KrakoanRunner } from '../src/engine/KrakoaRunner.js';
// Removed: import { KrakoanProgram } from '../src/schema/krakoa.schema.js';

describe('ExecutionFlow Opcodes', () => {
  let runner: KrakoanRunner;
  let program: any; // Changed from KrakoanProgram to any, type checking still happens via KrakoanRunner constructor

  beforeEach(() => {
    // Define a simple program to test execution flow:
    // 0: ➔ (Trigger) -> next: 1
    // 1: ⚓ (Anchor)  -> next: 2
    // 2: 🔃 (Jump to 4) -> IP becomes 4, next: -1 (auto-increment skipped)
    // 3: 🔗 (Link)    -> next: 4 (This should be skipped)
    // 4: 🏁 (Sentinel) -> HALTS
    program = {
      code: [
        { type: '➔', address: 0, next: [1], original: '➔' },
        { type: '⚓', address: 1, next: [2], original: '⚓' },
        { type: '🔃', address: 2, next: [-1], original: '🔃', target: 4 }, // Jump to address 4
        { type: '🔗', address: 3, next: [4], original: '🔗' }, // This instruction should be skipped
        { type: '🏁', address: 4, next: [-1], original: '🏁' },
      ],
      text: [], // No text pool needed for this simple program
      entry: 0,
    };
    runner = new KrakoanRunner(program);
  });

  test('should execute Trigger (➔) and advance IP', async () => {
    assert.strictEqual(runner.Registers['IP'], 0);
    assert.strictEqual(runner.Registers['Status'], 'RUNNING');

    await runner.step(); // Execute ➔

    assert.strictEqual(runner.Registers['IP'], 1);
    assert.strictEqual(runner.Registers['Status'], 'RUNNING');
  });

  test('should execute Anchor (⚓) and advance IP', async () => {
    // First execute Trigger
    await runner.step(); 
    assert.strictEqual(runner.Registers['IP'], 1);

    await runner.step(); // Execute ⚓

    assert.strictEqual(runner.Registers['IP'], 2);
    assert.strictEqual(runner.Registers['lastAnchor'], 1); // Check if anchor was registered
    assert.strictEqual(runner.Registers['Status'], 'RUNNING');
  });

  test('should execute Jump (🔃) and modify IP without auto-increment', async () => {
    // Execute Trigger and Anchor first to reach the jump instruction
    await runner.step(); // IP = 1 (➔)
    await runner.step(); // IP = 2 (⚓)
    assert.strictEqual(runner.Registers['IP'], 2);

    await runner.step(); // Execute 🔃 (Jump to 4)

    assert.strictEqual(runner.Registers['IP'], 4); // IP should now be 4, skipping address 3
    assert.strictEqual(runner.Registers['Status'], 'RUNNING');
  });

  test('should skip Link (🔗) due to Jump and then execute Sentinel (🏁) to halt', async () => {
    // Run through the entire program including the jump
    await runner.step(); // IP = 1 (➔)
    await runner.step(); // IP = 2 (⚓)
    await runner.step(); // IP = 4 (🔃 jump to 4)

    // Now at address 4, which is 🏁
    assert.strictEqual(runner.Registers['IP'], 4);
    assert.strictEqual(runner.Registers['Status'], 'RUNNING');

    await runner.step(); // Execute 🏁 (Sentinel)

    assert.strictEqual(runner.Registers['Status'], 'HALTED');
    // After halting, IP will not change further unless reset
    assert.strictEqual(runner.Registers['IP'], 4);
  });
});