import test, { beforeEach, it } from "node:test";
import assert from "node:assert";
import krakoa from "../src/engine/KrakoaEngine.js";
import { KrakoanRunner } from "../src/engine/KrakoaRunner.js";
import type { KrakoanProgram } from "../src/schema/krakoa.schema.js";

test("Testing the loop functionality", async () => {
  let program: KrakoanProgram;
  let runner: KrakoanRunner;

  beforeEach(async () => {
    program = await krakoa('src/programs/LoopTest.ksl');
    runner = new KrakoanRunner(program);
  });

  it('should run the loop for maxCycles times', async () => {
    assert.ok(program, "The program wasn't loaded.");
    assert.equal(runner.Registers.Status, 'RUNNING', "The runner wasn't started");

    const maxTestIterations = 1000; // Safety break for test
    let currentTestIteration = 0;

    while (runner.Registers.Status !== 'HALTED' && currentTestIteration < maxTestIterations) {
      const status = await runner.step();
      assert.ok(status, `The instruction at ${runner.Registers.IP} failed running! \nInstruction: ${JSON.stringify(program?.code[runner.Registers.IP])}`);
      currentTestIteration++;
    }

    assert.equal(runner.Registers.Status, 'HALTED', "The runner exited but is not HALTED");

    // After loop completion, check the final counter value
    const globalContext = runner.DataStack[0]; // Global context
    assert.ok(globalContext, "Global context is undefined."); // Added assertion for globalContext
    assert.ok(globalContext.__activeTriggers, "Active triggers context not found in global context.");
    assert.equal(globalContext.__activeTriggers.length, 0, "Active triggers list should be empty after loop completion.");

    const loopConceptId = 'LOOP_CONCEPT'; // ID from the KSL
    // The `runner.Symbols` stores the address, not the value.
    // The value itself would be in `globalContext` or another context.
    
    // We expect the value to be stored directly under the concept's ID in the global context
    // as modified by the `📌` instruction in the KSL: `📌("Counter", value: λ(ctx.Counter + 1));`
    // This value would be updated directly within `globalContext` (runner.DataStack[0]).
    assert.equal(globalContext[loopConceptId]?.Counter, 3, "Loop counter did not reach the expected final value.");

  });
});
