import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import readline from 'node:readline';
import * as esbuild from 'esbuild';
import { exec } from 'child_process';
import { KrakoanNodeSchema } from '../schema/krakoa.schema.js';
import { createRequire } from 'module';

const INPUT_DIR = './src/engine/krakoa';
const GRAMMAR_PATH = './src/grammar/grammar.pegjs';
const COMPILED_PATH = '../grammar/grammar.cjs';
const require = createRequire(import.meta.url);
const SNIPPETS: Record<string, string> = {
  ":fragment": "📑",
  ":concept": "🧠",
  ":entity": "👤",
  ":collection": "📦",
  ":logic": "🧬",
  ":asset": "🔓",
  ":state": "📌",
  ":tag": "🔑",
  ":stance": "🧩",
  ":time": "⌛",
  ":shield": "🛡️",
  ":link": "🔗",
  ":authority": "🔱",
  ":alliance": "🤝",
  ":conflict": "⚔️",
  ":trigger": "➔",
  ":anchor": "⚓",
  ":signal": "📡",
  ":speech": "💬"
};
const ALIASES = Object.keys(SNIPPETS);

export let parser: any = null;
export let isBuilding: boolean = false;
export let rl = readline.createInterface({
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

export function startWatcher() {
  const loadParser = () => {
    try {
      delete require.cache[require.resolve(COMPILED_PATH)];
      parser = require(COMPILED_PATH);
      if (rl) rl.prompt();
    } catch (e) {
      console.error("❌ Parser load error:", e);
    }
  };

  // Adaugă această funcție în Watcher
  const revalidateAll = () => {
    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.kts'));
    console.log(`🔄 Revalidating all ${files.length} files with the new grammar...`);
    
    files.forEach(file => {
      const fullPath = path.join(INPUT_DIR, file);
      // Trigger manual al evenimentului de schimbare
      watcher.emit('change', fullPath); 
    });
  };

  console.log('👁️ Krakoa Watcher: Activated. Keeping an eye on the horizon...');
  const watcher = chokidar.watch(path.resolve(INPUT_DIR), { 
    persistent: true,
    ignoreInitial: false,
    usePolling: true // Forțează-l să verifice manual
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
    if (!filePath.endsWith('.kts')) return;
    if (event !== 'change' && event !== 'add') return;

    const fileName = path.basename(filePath);
    console.log(`\n🔄 [${event.toUpperCase()}] Processing ${fileName}...`);

    try {
      const result = await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        write: false,
        format: 'esm',
        loader: { '.kts': 'ts' },
      });

      const rawSourceCode = result.outputFiles[0]?.text;

      if(!rawSourceCode) {
        throw new Error("The .kts file must have an export default k`...`");
      }

      const encodedJs = "data:text/javascript;base64," + Buffer.from(rawSourceCode).toString('base64');
      const rawModule = await import(encodedJs);

      console.log(`✅ ${fileName} -> Compiled and validated successfully`);
      console.log(`${JSON.stringify(rawModule.default, null, 2)}`);

      loadParser();
    } catch (error: any) {
      console.error(`❌ Error in ${fileName}:`);
      if (error.name === 'ZodError') {
        console.error('⚠️ Schema mismatch:', error.errors);
      } else {
        console.error('⚠️ Parser error:', error.message);
      }
    }
  });
}

