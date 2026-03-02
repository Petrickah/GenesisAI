import test, { beforeEach, it } from "node:test";
import { k } from "../src/engine/KrakoaCompiler.js";
import krakoa from "../src/engine/KrakoaEngine.js";
import { KrakoanRunner } from "../src/engine/KrakoaRunner.js";
import assert from "node:assert";
import type { KrakoanProgram } from "../src/schema/krakoa.schema.js";

test("Testing the runner", async () => {
  let program: KrakoanProgram = null;
  let runner: KrakoanRunner;

  beforeEach(async () => {
    program = await krakoa(k/*ts*/`
      🧠("NEX-LIB_MSG", name: "System Lexicon") {
        📌("Greeting", value: "Hello World!");
      };
      ➔ 👤("NEX-AGT_HELLO") {
        ➔ 🔗("IMPORT_MSG", mode: "Inheritance") 🔑 [
          @"NEX-LIB_MSG"
        ];
        ➔ 💬("Announce", to: "Architect") {
          📂("Message", content: λ(ctx["Greeting"]));
        };
      };
    `);

    runner = new KrakoanRunner(program);
  });

  it('is program loaded?', async () => {
    assert.ok(program, "The program wasn't loaded.");
  });
  
  it('is runner working?', async () => {
    assert.equal(runner.Registers.Status, 'RUNNING', "The runner wasn't started");
  });

  it('is runner correctly stepping?', async () => {
    const lastInstruction = Object.keys(program?.code ?? {}).length;
    const loopCounter = 0;
    while (runner.Registers.Status !== 'HALTED') {
      const status = await runner.step();
      assert.ok(status, `The instruction at ${runner.Registers.IP} failed running! \nInstruction: ${JSON.stringify(program?.code[runner.Registers.IP])}`);
      assert.ok(loopCounter < 100, "Infinite loop detected!");
    }

    assert.equal(runner.Registers.Status, 'HALTED', "The runner exited but is not HALTED");
    assert.equal(runner.Registers.IP, lastInstruction, "The runner exited but the IP is not the last instruction");
  })
});