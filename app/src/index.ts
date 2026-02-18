import chokidar from 'chokidar';
import { exec } from 'child_process';
import readline from 'node:readline';
import { createRequire } from 'module';
import { GenesisEngine } from './engine/GenesisEngine.js';

const require = createRequire(import.meta.url);
const GENESIS_ENGINE = new GenesisEngine();
const GRAMMAR_PATH = './src/grammar/grammar.pegjs';
const COMPILED_PATH = './grammar/grammar.cjs';

const SNIPPETS: Record<string, string> = {
  ":concept": "🧠",
  ":agent": "👤",
  ":logic": "🧬",
  ":shield": "🛡️",
  ":sword": "⚔️",
  ":link": "🔗",
  ":anchor": "⚓",
  ":go": "➔",
};

const ALIASES = Object.keys(SNIPPETS);

function startSystem() {
  let isBuilding = false;

  const launch = () => {
    const args = process.argv.slice(2);

    if (args.includes('--repl')) {
      console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
      launchREPL();
    } else {
      console.log("--- 🌐 GENESIS HEADLESS MODE (SERVER) ---");
      launchServer();
    }
  }

  console.log("👁️  Watcher activated to update the grammar...");
  chokidar.watch(GRAMMAR_PATH).on('change', () => {
    console.log("\n🛠️ Change has been detected! Recompiling the grammar...");
    isBuilding = true;
    exec('npm run build:grammar', (error, stdout, stderr) => {
      isBuilding = false;

      if (error) {
        console.error(`❌ Build error: ${error.message}`);
        return;
      }

      console.log(`✅ Grammar has been updated!`);
      delete require.cache[require.resolve(COMPILED_PATH)];
      launch();
    });
  });

  return isBuilding
    ? console.log("⚙️ Recompiling grammar...")
    : launch()
    ;
}

function execute(input: string) {
  try {
    const parser = require(COMPILED_PATH);
    const ast = parser.parse(input);
    console.log(JSON.stringify(ast, null, 2));

    const result = GENESIS_ENGINE.execute(ast);
    console.log(result);
  } catch (e: any) {
    console.error(`⚠️  Error: Invalid Krakoan Syntax at line ${e.location?.start.line || 0}:${e.location?.start.column || 0}`);
    console.error(`⚠️  Message: ${e.message}`);
  }
}

function launchREPL() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>>> ',
    completer: (line: string) => {
      const hits = ALIASES.filter((a) => a.startsWith(line));

      if (hits.length === 1 && line.length > 1) {
        return [[SNIPPETS[hits[0]!]], line];
      }

      return [hits.length ? hits : ALIASES, line];
    }
  });

  let multiLineBuffer = "";

  rl.prompt();
  rl.on('line', (line) => {
    multiLineBuffer += line + "\n";

    const openedBraces = (multiLineBuffer.match(/{/g) || []).length;
    const closedBraces = (multiLineBuffer.match(/}/g) || []).length;

    if (openedBraces > closedBraces) {
      rl.setPrompt('... ');
      return rl.prompt();
    }

    const finalInput = multiLineBuffer.trim();
    multiLineBuffer = "";
    rl.setPrompt('>>> ');

    if (!finalInput) {
      return rl.prompt();
    }

    if (finalInput === '.exit') {
      return process.exit(0);
    }

    execute(finalInput);
    rl.prompt();
  });
}

function launchServer() {
  console.log("The system runs in background...");
}

startSystem();