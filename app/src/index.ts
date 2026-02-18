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

let currentParser: any = null;
const ALIASES = Object.keys(SNIPPETS);

function startSystem() {
  let isBuilding = false;
  let currentREPL: readline.Interface | undefined = undefined;

  const launch = () => {
    const args = process.argv.slice(2);

    if (args.includes('--repl')) {
      console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
      return launchREPL();
    } else {
      console.log("--- 🌐 GENESIS HEADLESS MODE (SERVER) ---");
      launchServer();
    }
  }

  const loadParser = (readline?: readline.Interface) => {
    try {
      delete require.cache[require.resolve(COMPILED_PATH)];
      currentParser = require(COMPILED_PATH); // Actualizează variabila globală
      console.log("✅ Grammar hot-swapped!");
      if (readline) readline.prompt();
    } catch (e) {
      console.error("❌ Parser load error:", e);
    }
  };

  console.log("👁️  Watcher activated to update the grammar...");
  loadParser();

  if (!isBuilding) {
    currentREPL = launch();
  }

  chokidar.watch(GRAMMAR_PATH).on('change', () => {
    console.log("\n🛠️ Recompiling the grammar...");
    isBuilding = true;
    exec('npm run build:grammar', (error, stdout, stderr) => {
      isBuilding = false;

      if (error) {
        console.error(`❌ Build error: ${error.message}`);
        return;
      }

      console.clear();
      console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
      console.log("👁️  Watcher: Grammar updated and hot-swapped!");

      loadParser(currentREPL);
    });
  });
}

function execute(input: string) {
  console.log("DEBUG: Input primit în engine:", `"${input}"`); // Ar trebui să apară imediat ce apeși Enter
  
  if (!currentParser) {
    console.log("🧬 [System Error]: Creierul (Parserul) nu a fost încărcat!");
    return;
  }

  try {
    const ast = currentParser.parse(input);
    console.log(JSON.stringify(ast, null, 2));

    GENESIS_ENGINE.execute(ast);
  } catch (e: any) {
    console.error(`⚠️  Error: Invalid Krakoan Syntax at line ${e.location?.start.line || 0}:${e.location?.start.column || 0}`);
    console.error(`⚠️  Message: ${e.message}`);
  }
}

function launchREPL(): readline.Interface {
  let multiLineBuffer = "";

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>>> ',
    completer: (line: string) => {
      // 1. Spargem linia în cuvinte/token-uri
      const words = line.split(/\s+/);
      // 2. Ne interesează doar ultimul cuvânt (cel pe care îl scrii acum)
      const lastWord = words[words.length - 1] || "";

      // 3. Filtrăm ALIASES pe baza ultimului cuvânt
      const hits = ALIASES.filter((a) => a.startsWith(lastWord));

      if (hits.length === 1 && lastWord.length > 1) {
        // ⚠️ AICI E MAGIA: 
        // Returnăm snippet-ul, dar readline are nevoie de "substring-ul" 
        // care va fi înlocuit (lastWord), nu toată linia!
        return [[SNIPPETS[hits[0]!]], lastWord];
      }

      // Dacă sunt mai multe variante, le afișăm doar pentru ultimul cuvânt
      return [hits.length ? hits : ALIASES, lastWord];
    }
  });

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

    switch (finalInput) {
      case '.exit':
        return process.exit(0);
      case '.clear':
        console.clear();
        console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
        return rl.prompt();
    }

    execute(finalInput);
    rl.prompt();
  });

  return rl;
}

function launchServer() {
  console.log("The system runs in background...");
}

startSystem();