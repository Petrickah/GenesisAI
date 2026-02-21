import { KrakoaREPL } from './ui/KrakoaREPL.js';
import * as KrakoaWatcher from './engine/KrakoaWatcher.js';

async function startSystem() {
  const isReplMode = process.argv.includes('--repl');
  
  if (isReplMode) {
    const repl = new KrakoaREPL();
    repl.start();
  } else {
    launchServer();
  }
}

function launchServer() {
  console.log("--- 🌐 GENESIS HEADLESS MODE (SERVER) ---");
  KrakoaWatcher.startWatcher(false);
}

startSystem().catch(err => console.error("Critical System Failure:", err));