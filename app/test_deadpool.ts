import krakoa from './src/engine/KrakoaEngine.js';
import { KrakoanRunner } from './src/engine/KrakoaRunner.js';

async function test() {
  console.log("🚀 Testing Deadpool.ksl...");
  
  try {
    const program = await krakoa('src/programs/Deadpool.ksl');
    if (!program) {
      console.error("❌ Failed to compile Deadpool.ksl");
      return;
    }

    const runner = new KrakoanRunner(program);
    console.log("🏁 Program loaded. Starting execution...");

    let steps = 0;
    // Increase step limit for Deadpool as it's more complex
    while (runner.Registers["Status"] === 'RUNNING' && steps < 500) {
      const ok = await runner.step();
      if (!ok) break;
      steps++;
    }

    console.log(`✅ Execution finished in ${steps} steps.`);
    console.log("Final Status:", runner.Registers["Status"]);
    
    // Check if Chimichanga message was absorbed
    const finalContext = runner.DataStack[0];
    console.log("Final Root Context Keys (sample):", Object.keys(finalContext || {}).slice(0, 10));
    
    if (finalContext && finalContext["Chimichanga Optimized"]) {
      console.log("🎉 SUCCESS: 'Chimichanga Optimized' was absorbed!");
      const chimData = finalContext["Chimichanga Optimized"];
      console.log("Content:", typeof chimData === 'object' ? chimData.content : chimData);
    } else {
      console.log("❌ FAILURE: 'Chimichanga Optimized' was NOT absorbed.");
    }

  } catch (error) {
    console.error("❌ Test Error:", error);
  }
}

test();
