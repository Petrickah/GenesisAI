import readline from 'node:readline';
import { createRequire } from 'module';

// Creăm o funcție require care funcționează chiar și în ESM
const require = createRequire(import.meta.url);

function getParser() {
  const grammarPath = require.resolve('./grammar/grammar.cjs');
  
  // În Node.js modern, delete require.cache merge doar dacă fișierul e .cjs
  delete require.cache[grammarPath];
  
  return require(grammarPath);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'GENESIS> '
});

console.log("🛠️ GenesisAI REPL - Modul 'Hot Grammar' Activat");
rl.prompt();

rl.on('line', (line) => {
  if (line.trim() === '.reload') {
    console.log("♻️  Reîncărcăm gramatica...");
    rl.prompt();
    return;
  }

  try {
    const parser = getParser(); // Luăm versiunea curentă a gramaticii
    const ast = parser.parse(line);
    console.log(JSON.stringify(ast, null, 2));
  } catch (e: any) {
    console.error(`❌ Eroare: ${e.message}`);
  }
  rl.prompt();
});