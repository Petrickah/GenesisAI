import * as readline from 'readline';
import { k } from '../engine/KrakoaCompiler.js';
import krakoa from '../engine/KrakoaEngine.js';

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

export class KrakoaREPL {
  private buffer = "";
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
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

  public start() {
    console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
    this.rl.prompt();
    this.rl.on('line', async (line) => await this.handleLine(line));
  }

  public prompt() {
    this.rl.prompt();
  }

  private async handleLine(line: string) {
    this.buffer += line + "\n";
    const openedBraces = (this.buffer.match(/{/g) || []).length;
    const closedBraces = (this.buffer.match(/}/g) || []).length;

    if (openedBraces > closedBraces) {
      this.rl.setPrompt('... ');
      return this.rl.prompt();
    }

    const finalInput = this.buffer.trim();
    this.buffer = "";
    this.rl.setPrompt('>>> ');

    if (!finalInput) return this.rl.prompt();
    if (this.handleCommands(finalInput)) return;

    await this.execute(finalInput);
    this.rl.prompt();
  }

  private handleCommands(input: string): boolean {
    if (input === '.exit') process.exit(0);
    if (input === '.clear') {
      console.clear();
      console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
      this.rl.prompt();
      return true;
    }

    return false;
  }

  private async execute(input: string) {
    const krakoanProgram = await krakoa(/*ts*/`
      export default ${JSON.stringify(k`${input}`, null, 2)};
    `, false);

    if (krakoanProgram) {
      console.log(JSON.stringify(krakoanProgram, null, 2));
    }
  }
}