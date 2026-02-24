import * as readline from 'readline';
import { k } from '../engine/KrakoaCompiler.js';
import krakoa from '../engine/KrakoaEngine.js';
import { KrakoanRunner } from '../engine/KrakoaRunner.js';
import type { KrakoanInstruction } from '../schema/krakoa.schema.js';

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
  ":jump"         : "🔃",
  ":authority"    : "🔱",
  ":alliance"     : "🤝",
  ":conflict"     : "⚔️",
  ":trigger"      : "➔",
  ":anchor"       : "⚓",
  ":signal"       : "📡",
  ":speech"       : "💬",
  ".st"           : ".step",
  ".loa"          : ".load 'src/programs/Deadpool.ksl'",
  ".pri"          : ".print",
  ".cl"           : ".clear",
  ".ex"           : ".exit"
};

const ALIASES = Object.keys(SNIPPETS);

export class KrakoaREPL {
  private buffer = "";
  private runner?: KrakoanRunner | undefined;
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
    if (await this.handleCommands(finalInput)) return;
    
    this.runner = this.runner ?? await this.execute(finalInput);
    this.rl.prompt();
  }

  private async handleCommands(input: string): Promise<boolean> {
    const [cmd, ...args] = input.split(' ');

    switch (cmd) {
      case '.load':
        await this.loadProgram(args[0]); // Încarcă un .kts
        return true;
      case '.step':
        if (this.runner) {
          await this.handleStep();
        } else {
          console.log("❌ No program loaded. Use .load <path>");
        }
        return true;
      case '.print':
        if (this.runner) {
          console.log("🧠 Context:", JSON.stringify(this.runner, null, 2));
          this.rl.prompt();
        }
        return true;
      case '.clear':
        console.clear();
        this.rl.prompt();
        return true;

      case '.exit':
        return process.exit(0);
    }

    return false;
  }

  private async loadProgram(arg0?: string): Promise<void> {
    if (!arg0) throw new Error("No program path has been suplied");
    this.runner = new KrakoanRunner(await krakoa(arg0.slice(1, -1)));
    this.runner.IsRunning = true;
    this.rl.prompt();
  }

  private async execute(input: string) {
    const krakoanProgram = await krakoa(/*ts*/`
      export default ${JSON.stringify(k`${input}`, null, 2)};
    `, false);

    if (krakoanProgram) {
      return new KrakoanRunner(krakoanProgram);
    }
  }

  private async handleStep() {
    const { Program, InstructionPointer, Context } = this.runner ?? {};
    if (!this.runner || !Program || typeof InstructionPointer === 'undefined') return;

    console.clear();
    console.log(`=== 👾 KRAKOAN DEBUGGER (GDB Mode) ===`);
    console.log(`[ IP: ${InstructionPointer ?? 'HALTED'} | Symbols: ${Object.keys(Program?.symbols ?? {}).length}]`);

    const hasMore = await this.runner.step();
    this.renderDebugFrame(this.runner);
    if (!hasMore) {
      console.log("\x1b[33m[SYSTEM]: Program execution halted (End of stack).\x1b[0m");
    }
    this.rl.prompt();
  }

  private renderDebugFrame(runner: KrakoanRunner, windowSize: number = 5) {
    const { Program, InstructionPointer, Context } = runner;
    
    if (Context) {
      const ctxKeys = Object.keys(Context);
      if (ctxKeys.length > 0) {
        const ctxView = ctxKeys.map(k => `${k}: ${Context[k]}`).join(' | ');
        console.log(`\x1b[90m[ Context: ${ctxView} ]\x1b[0m\n`);
      } else {
        console.log(`\x1b[90m[ Context: empty ]\x1b[0m\n`);
      }
    }
    
    renderWindow(runner, windowSize);

    function printLine(runner: KrakoanRunner, currAddr: number) {
      if (!Program) return;
      if (!Program?.code[currAddr]) return;

      const activeInst = runner.decode(Program.code[currAddr]);
      const isCurrent = currAddr === InstructionPointer;
      const pointer = isCurrent ? "  ==>  " : "       ";
      const opcode = activeInst?.type?.toString().padEnd(10);

      function processParamsList(value: any): string {
        if (typeof value === 'object') {
          let paramsList: string[] = [];
          for (let key in value) {
            paramsList.push(`${key}: ${processParamsList(value[key])}`);
          }
          return paramsList.join(', ') ?? 'empty';
        }
        return `"${value}"`;
      }

      const paramsList = processParamsList(activeInst?.params) || 'anon';

      if (isCurrent) {
        process.stdout.write(`\x1b[32m${pointer}[${currAddr.toString().padStart(3, '0')}]: ${opcode}(${paramsList})\x1b[0m\n`);
      } else {
        console.log(`${pointer}[${currAddr.toString().padStart(3, '0')}]: ${opcode}(${paramsList})`);
      }
    }

    function renderWindow(runner: KrakoanRunner, windowSize: number = 5) {
      if (!Program || typeof InstructionPointer == 'undefined') return;
      
      const half = Math.floor(windowSize / 2);
      const totalInstructions = Object.keys(Program.code).length;
      
      let start = Math.max(0, InstructionPointer - half);
      let end   = Math.min(totalInstructions - 1, start + windowSize - 1);
      
      if (end - start < windowSize - 1) {
        start = Math.max(0, end - windowSize + 1);
      }
      
      console.log(`--- 🪟 WINDOW: [${start.toString().padStart(3,'0')} - ${end.toString().padStart(3,'0')}] ---`);
      for (let index = start; index <= end; index++) {
        printLine(runner, index);
      }
    }
  }
}