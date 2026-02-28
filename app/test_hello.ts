import krakoa from './src/engine/KrakoaEngine.js';
import { KrakoanRunner } from './src/engine/KrakoaRunner.js';

async function test() {
  console.log("🚀 Testing HelloWorld.ksl...");
  
  try {
    const program = await krakoa('src/programs/HelloWorld.ksl');
    if (!program) {
      console.error("❌ Failed to compile HelloWorld.ksl");
      return;
    }

    const runner = new KrakoanRunner(program);
    console.log("🏁 Program loaded. Starting execution...");

    let steps = 0;
    while (runner.Registers["Status"] === 'RUNNING' && steps < 100) {
      const ok = await runner.step();
      if (!ok) break;
      steps++;
    }

    console.log(`✅ Execution finished in ${steps} steps.`);
    console.log("Final Status:", runner.Registers["Status"]);
    
    // Check if Greeting was absorbed
    const finalContext = runner.DataStack[0];
    console.log("Final Root Context Keys:", Object.keys(finalContext || {}));
    if (finalContext && finalContext["Greeting"]) {
      console.log("🎉 SUCCESS: 'Greeting' was absorbed into the root context!");
    } else {
      console.log("❌ FAILURE: 'Greeting' was NOT absorbed into the root context.");
    }

  } catch (error) {
    console.error("❌ Test Error:", error);
  }
}

test();
