import { k } from './engine/GenesisEngine.js';
import * as KrakoaLauncher from './engine/KrakoaWatcher.js';

function startSystem() {
  KrakoaLauncher.startWatcher();
  const args = process.argv.slice(2);

  if (args.includes('--repl')) {
    console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
    launchREPL();
  } else {
    console.log("--- 🌐 GENESIS HEADLESS MODE (SERVER) ---");
    launchServer();
  }
}

function execute(input: string) {
  if (!KrakoaLauncher.parser) {
    console.log("🧬 [System Error]: The Parser hasn't been loaded!");
    return;
  }

  try {
    const validatedGraph = k`${input}`
    console.log(JSON.stringify(validatedGraph, null, 2));

  } catch (e: any) {
    console.error(`⚠️ Error: Invalid Krakoan Syntax at line ${e.location?.start.line || 0}:${e.location?.start.column || 0}`);
    console.error(`⚠️ Message: ${e.message}`);
  }
}

function launchREPL() {
  let multiLineBuffer = "";

  KrakoaLauncher.rl.prompt();
  KrakoaLauncher.rl.on('line', (line) => {
    multiLineBuffer += line + "\n";

    const openedBraces = (multiLineBuffer.match(/{/g) || []).length;
    const closedBraces = (multiLineBuffer.match(/}/g) || []).length;

    if (openedBraces > closedBraces) {
      KrakoaLauncher.rl.setPrompt('... ');
      return KrakoaLauncher.rl.prompt();
    }

    const finalInput = multiLineBuffer.trim();
    multiLineBuffer = "";
    KrakoaLauncher.rl.setPrompt('>>> ');

    if (!finalInput) {
      return KrakoaLauncher.rl.prompt();
    }

    switch (finalInput) {
      case '.exit':
        return process.exit(0);
      case '.clear':
        console.clear();
        console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
        return KrakoaLauncher.rl.prompt();
    }

    execute(finalInput);
    KrakoaLauncher.rl.prompt();
  });

  return KrakoaLauncher.rl;
}

function launchServer() {
  console.log("The system runs in background...");
}

startSystem();