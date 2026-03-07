import * as KrakoaWatcher from './engine/KrakoaWatcher.js';

async function startSystem() {
  const isReplMode = process.argv.includes('--repl');
  const repl = KrakoaWatcher.startWatcher(isReplMode);
  
  if (isReplMode && repl) {
    repl.start();
  } else {
    console.log("--- 🌐 GENESIS HEADLESS MODE (SERVER) ---");
  }
}

startSystem().catch(err => console.error("Critical System Failure:", err));