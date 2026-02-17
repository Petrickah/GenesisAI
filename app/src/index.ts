import chokidar from 'chokidar';
import { exec } from 'child_process';
import readline from 'node:readline';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
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

  // Snippets complexe (Structuri întregi)
  ":newagent": "👤(Name) ➔ [ ⚙️(Task) ]",
  ":newconcept": "🧠(ConceptName) { 🧬(logic: \"...\") }",
  ":full": "👤(Wade) ➔ [ ⚙️(EatPizza) 🛡️(Aggressive) ]"
};

// Extragem cheile pentru autocompletare (ex: [":concept", ":agent", ...])
const ALIASES = Object.keys(SNIPPETS);

let isBuilding = false;

console.log("👁️ Watcher activated to update the grammar...");

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
    rl.prompt();
  });
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'GENESIS> ',
  completer: (line: string) => {
    // Găsim dacă ceea ce am scris până acum se potrivește cu un început de alias
    const hits = ALIASES.filter((a) => a.startsWith(line));

    // Dacă avem o singură potrivire perfectă și apăsăm TAB
    if (hits.length === 1 && line.length > 1) {
       // Returnăm emoji-ul corespunzător. 
       // Node va înlocui prefixul (ex: :con) cu valoarea (ex: 🧠)
       return [[SNIPPETS[hits[0]!]], line];
    }

    // Dacă avem mai multe potriviri, le afișăm ca listă
    return [hits.length ? hits : ALIASES, line];
  }
});

console.log("🚀 GenesisAI Console Ready.");
rl.prompt();

rl.on('line', (line) => {
  if (!line.trim() || isBuilding) {
    console.log("⚙️ Empty line or still building the grammar...")
    rl.prompt();
    return;
  }

  if (line.trim().toLowerCase() === '.exit') {
    console.log("👋 Good Bye!");
    rl.close();
    process.exit(0);
  }

  try {
    const parser = require(COMPILED_PATH);
    const ast = parser.parse(line);
    console.log(JSON.stringify(ast, null, 2));
  } catch (e: any) {
    console.error(`⚠️ Error: ${e.message}`);
  }

  rl.prompt();
});