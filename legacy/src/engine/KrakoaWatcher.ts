/**
 * Krakoa Hot-Reloading Watcher
 * 
 * Monitors the filesystem for changes in .ksl scripts and the .pegjs grammar.
 * Automatically recompiles the grammar and re-validates scripts on change.
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { exec } from 'child_process';
import { createRequire } from 'module';
import krakoa from './KrakoaEngine.js';
import { KrakoaREPL } from '../ui/KrakoaREPL.js';

const INPUT_DIR = 'src/programs';
const GRAMMAR_PATH = 'src/grammar/grammar.pegjs';
const COMPILED_PATH = '../grammar/grammar.cjs';
const require = createRequire(import.meta.url);

export let parser: any = null;
export let isBuilding: boolean = false;

/**
 * Initializes the file watcher and optionally starts the REPL.
 * 
 * @param isREPL - Whether to start the interactive REPL.
 * @returns The active REPL instance if isREPL is true.
 */
export function startWatcher(isREPL: boolean = false) {
  const currentREPL = isREPL ? new KrakoaREPL() : undefined;

  /**
   * Hot-swaps the compiled Peggy.js parser in memory.
   */
  const loadParser = () => {
    try {
      delete require.cache[require.resolve(COMPILED_PATH)];
      parser = require(COMPILED_PATH);
      if (currentREPL) currentREPL.prompt();
    } catch (e) {
      console.error("❌ Parser load error:", e);
    }
  };

  /**
   * Forces a re-validation of all scripts when the grammar changes.
   */
  const revalidateAll = () => {
    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.ksl'));
    console.log(`🔄 Revalidating all ${files.length} files with the new grammar...`);
    
    files.forEach(file => {
      const fullPath = path.join(INPUT_DIR, file);
      watcher.emit('change', fullPath); 
    });
  };

  console.log('👁️ Krakoa Watcher: Activated. Keeping an eye on the horizon...');
  
  // Watch for script changes
  const watcher = chokidar.watch(path.resolve(INPUT_DIR), { 
    persistent: true,
    ignoreInitial: false,
    usePolling: true
  });

  loadParser();
  
  // Watch for grammar changes to trigger recompilation
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

  /**
   * Handles individual script changes or additions.
   */
  watcher.on('all', async (event, filePath) => {
    const fileName = path.basename(filePath);
    if (!fileName.endsWith('.ksl')) return;
    if (event !== 'change' && event !== 'add') return;
    
    console.clear();
    console.log(`👁️ Watcher: The ${fileName} Krakoan Program is being watched!`);
    
    // Attempt to load and validate the script via the engine
    const krakoanProgram = await krakoa(`${INPUT_DIR}/${fileName}`);

    if (krakoanProgram) {
      console.log(`✅ [${event.toUpperCase()}] The file ${fileName} was validated successfully...`);
    }
  });

  return currentREPL;
}
