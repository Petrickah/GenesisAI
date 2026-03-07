import test, { it } from "node:test";
import assert from "node:assert";
import krakoa from "../src/engine/KrakoaEngine.js";
import { KrakoanRunner } from "../src/engine/KrakoaRunner.js";

test("Cycle Logic Verification", async () => {
  it('should jump exactly the specified number of cycles', async () => {
    // ⚓ ("START");
    // 🔃 ("LOOP", goto: "START", cycles: 2) 🔑 [@"START"];
    const program = await krakoa({
      entry: 0,
      symbols: { "START": 0 },
      code: {
        0: { type: "⚓", params: { id: "START" }, next: [1], timestamp: Date.now() },
        1: { type: "🔃", params: { goto: "START", cycles: 2 }, tags: [{ root: "START", kind: "reference", original: "@START", segments: ["START"], target: "START", address: 0 }], next: [2], timestamp: Date.now() },
        2: { type: "🏁", params: {}, next: [], timestamp: Date.now() }
      }
    }, false);

    const runner = new KrakoanRunner(program);

    // Step 0: Anchor
    await runner.step();
    assert.equal(runner.Registers.IP, 1);

    // Step 1: Jump (Iteration 1)
    await runner.step();
    assert.equal(runner.Registers.IP, 0);

    // Step 2: Anchor
    await runner.step();
    assert.equal(runner.Registers.IP, 1);

    // Step 3: Jump (Iteration 2)
    await runner.step();
    assert.equal(runner.Registers.IP, 0);

    // Step 4: Anchor
    await runner.step();
    assert.equal(runner.Registers.IP, 1);

    // Step 5: Jump (Iteration 3 - should not jump)
    await runner.step();
    assert.equal(runner.Registers.IP, 2);

    assert.equal(runner.Registers.Status, 'RUNNING');
    await runner.step();
    assert.equal(runner.Registers.Status, 'HALTED');
  });

  it('should be blind to maxCycles on triggers', async () => {
    // ➔ (maxCycles: 2) {
    //   ⚓ ("BODY");
    // }
    const program = await krakoa({
      entry: 0,
      symbols: {},
      code: {
        0: { type: "➔", timestamp: Date.now(), params: { maxCycles: 2 }, next: [1, 2] },
        1: { type: "⚓", timestamp: Date.now(), params: { id: "BODY" }, next: [2] },
        2: { type: "🏁", timestamp: Date.now(), params: { bodyAddr: 1 }, next: [] }
      }
    }, false);

    const runner = new KrakoanRunner(program);

    // Step 0: Trigger
    await runner.step();
    assert.equal(runner.Registers.IP, 1);

    // Step 1: Anchor
    await runner.step();
    assert.equal(runner.Registers.IP, 2);

    // Step 2: Sentinel (Should NOT loop back even though maxCycles: 2 was on trigger)
    await runner.step();
    // It should NOT jump back to 1. If it were looping, IP would be 1.
    assert.notEqual(runner.Registers.IP, 1);
    assert.equal(runner.Registers.Status, 'HALTED');
  });
});
