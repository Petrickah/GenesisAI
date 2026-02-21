import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import readline from 'node:readline';
import { exec } from 'child_process';
import { createRequire } from 'module';
import krakoa from './KrakoaEngine.js';

const INPUT_DIR = './src/programs';
const GRAMMAR_PATH = './src/grammar/grammar.pegjs';
const COMPILED_PATH = '../grammar/grammar.cjs';
const require = createRequire(import.meta.url);
const SNIPPETS: Record<string, string> = {
  ":fragment"     : "📑",
  ":concept"      : "🧠",
  ":entity"       : "👤",
  ":collection"   : "📦",
  ":content"      : "📂",
  ":logic"        : "🧬",
  ":asset"        : "🔓",
  ":state"        : "📌",
  ":tag"          : "🔑",
  ":stance"       : "🧩",
  ":time"         : "⌛",
  ":shield"       : "🛡️",
  ":utility"      : "🩺",
  ":function"     : "💉",
  ":action"       : "🚀",
  ":intent"       : "🎭",
  ":link"         : "🔗",
  ":authority"    : "🔱",
  ":alliance"     : "🤝",
  ":conflict"     : "⚔️",
  ":trigger"      : "➔",
  ":anchor"       : "⚓",
  ":signal"       : "📡",
  ":speech"       : "💬"
};
const ALIASES = Object.keys(SNIPPETS);

export let parser: any = null;
export let isBuilding: boolean = false;
export let rl = (isREPL: boolean) => {
  if (!isREPL) return null;

  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>>> ',
    completer: (line: string) => {
      const words = line.split(/\s+/);
      const lastWord = words[words.length - 1] || "";
      const hits = ALIASES.filter((a) => a.startsWith(lastWord));

      if (hits.length === 1 && lastWord.length > 1) {
        return [[SNIPPETS[hits[0]!]], lastWord];
      }

      return [hits.length ? hits : ALIASES, lastWord];
    }
  });
}

export function startWatcher(isREPL: boolean = false) {
  const currentREPL = rl(isREPL);

  const loadParser = () => {
    try {
      delete require.cache[require.resolve(COMPILED_PATH)];
      parser = require(COMPILED_PATH);
      if (currentREPL) currentREPL.prompt();
    } catch (e) {
      console.error("❌ Parser load error:", e);
    }
  };

  const revalidateAll = () => {
    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.kts'));
    console.log(`🔄 Revalidating all ${files.length} files with the new grammar...`);
    
    files.forEach(file => {
      const fullPath = path.join(INPUT_DIR, file);
      watcher.emit('change', fullPath); 
    });
  };

  console.log('👁️ Krakoa Watcher: Activated. Keeping an eye on the horizon...');
  const watcher = chokidar.watch(path.resolve(INPUT_DIR), { 
    persistent: true,
    ignoreInitial: false,
    usePolling: true
  });

  loadParser();
  
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
      console.log("👁️ Watcher: Grammar updated and hot-swapped!");
      
      revalidateAll();
      loadParser();
    });
  });

  watcher.on('all', async (event, filePath) => {
    const fileName = path.basename(filePath);
    if (!fileName.endsWith('.kts')) return;
    if (event !== 'change' && event !== 'add') return;
    
    console.clear();
    console.log(`👁️ Watcher: The ${fileName} Krakoan Program is being watched!`);
    const krakoanProgram = await krakoa(filePath);

    if (krakoanProgram) {
      console.log(`✅ [${event.toUpperCase()}] The file ${fileName} was validated successfully...`);
    }
  });

  return currentREPL;
}

