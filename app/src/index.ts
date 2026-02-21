import { k } from './engine/KrakoaCompiler.js';
import * as KrakoaWatcher from './engine/KrakoaWatcher.js';

async function startSystem() {
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
  if (!KrakoaWatcher.parser) {
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

  let currentREPL = KrakoaWatcher.startWatcher(true);
  if(!currentREPL) return;

  currentREPL.prompt();
  currentREPL.on('line', (line) => {
    multiLineBuffer += line + "\n";

    const openedBraces = (multiLineBuffer.match(/{/g) || []).length;
    const closedBraces = (multiLineBuffer.match(/}/g) || []).length;

    if (openedBraces > closedBraces) {
      currentREPL.setPrompt('... ');
      return currentREPL.prompt();
    }

    const finalInput = multiLineBuffer.trim();
    multiLineBuffer = "";
    currentREPL.setPrompt('>>> ');

    if (!finalInput) {
      return currentREPL.prompt();
    }

    switch (finalInput) {
      case '.exit':
        return process.exit(0);
      case '.clear':
        console.clear();
        console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
        return currentREPL.prompt();
    }

    execute(finalInput);
    currentREPL.prompt();
  });
}

function launchServer() {
  KrakoaWatcher.startWatcher(false);
}

startSystem();