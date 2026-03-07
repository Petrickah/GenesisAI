/**
 * Krakoa Interactive REPL
 * 
 * Provides a command-line interface for interacting with the Krakoan engine.
 * Supports hot-loading programs, stepping through execution, and inspecting state.
 */

import * as readline from 'readline';
import { k } from '../engine/KrakoaCompiler.js';
import krakoa from '../engine/KrakoaEngine.js';
import { KrakoanRunner } from '../engine/KrakoaRunner.js';
import type { KrakoanInstruction } from '../schema/krakoa.schema.js';

/**
 * Common code snippets for fast access in the REPL.
 */
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

/**
 * Manages the interactive session between the user and the VM.
 */
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

  /**
   * Starts the REPL event loop.
   */
  public start() {
    console.log("--- 🧠 GENESIS CONSOLE MODE (REPL) ---");
    this.rl.prompt();
    this.rl.on('line', async (line) => await this.handleLine(line));
  }

  /**
   * Re-displays the current prompt.
   */
  public prompt() {
    this.rl.prompt();
  }

  /**
   * Processes each line entered by the user.
   * Handles multi-line input by tracking brace depth.
   */
  private async handleLine(line: string) {
    this.buffer += line + "\n";
    const openedBraces = (this.buffer.match(/{/g) || []).length;
    const closedBraces = (this.buffer.match(/}/g) || []).length;

    // Continue multi-line input if braces are unbalanced
    if (openedBraces > closedBraces) {
      this.rl.setPrompt('... ');
      return this.rl.prompt();
    }

    const finalInput = this.buffer.trim();
    this.buffer = "";
    this.rl.setPrompt('>>> ');

    if (!finalInput) return this.rl.prompt();
    
    // Check if input is a REPL command (.load, .step, etc.)
    if (await this.handleCommands(finalInput)) return;
    
    // Otherwise, treat input as an ad-hoc Krakoan script
    this.runner = this.runner ?? await this.execute(finalInput);
    this.rl.prompt();
  }

  /**
   * Dispatches REPL system commands (.cmd).
   */
  private async handleCommands(input: string): Promise<boolean> {
    const [cmd, ...args] = input.split(' ');

    switch (cmd) {
      case '.load':
        await this.loadProgram(args[0]);
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

  /**
   * Loads a .ksl file and initializes a new runner.
   * @param arg0 - Path to the file.
   */
  private async loadProgram(arg0?: string): Promise<void> {
    if (!arg0) throw new Error("No program path has been supplied");
    const programPath = arg0.slice(1, -1); // Remove quotes
    const program = await krakoa(programPath);
    this.runner = new KrakoanRunner(program);
    this.rl.prompt();
  }

  /**
   * Compiles and executes an ad-hoc snippet directly from the console.
   */
  private async execute(input: string) {
    const krakoanProgram = await krakoa(/*ts*/`
      export default ${JSON.stringify(k`${input}`, null, 2)};
    `, false);

    if (krakoanProgram) {
      return new KrakoanRunner(krakoanProgram);
    }
  }

  /**
   * Step debugger view. Shows registers and instruction window.
   */
  private async handleStep() {
    const { Program, Registers } = this.runner ?? {};
    if (!this.runner || !Program || !Registers) return;

    console.clear();
    console.log(`=== 👾 KRAKOAN DEBUGGER (GDB Mode) ===`);
    console.log(`[ IP: ${Registers['IP'] ?? 'HALTED'} | Status: ${Registers['Status'] ?? 'HALTED'} | Symbols: ${Object.keys(Program.symbols).length}]`);

    await this.renderDebugFrame(this.runner);
    const hasMore = await this.runner.step();
    if (!hasMore) {
      console.log("\x1b[33m[SYSTEM]: Program execution halted (End of stack).\x1b[0m");
    }
    this.rl.prompt();
  }

  /**
   * Renders the visual debugging frame, including current context and surrounding instructions.
   */
  private async renderDebugFrame(runner: KrakoanRunner, windowSize: number = 5) {
    const { Program, Registers, DataStack: ContextStack } = runner;

    const currContext = ContextStack[Registers.ESP];
    if (currContext) {
      const hasKeys = Object.keys(currContext).length > 0;
      if (hasKeys) {
        console.log(`\x1b[90mContext: [ ${JSON.stringify(currContext, null, 2)} ]\x1b[0m\n`);
      } else {
        console.log(`\x1b[90mContext: [ empty ]\x1b[0m\n`);
      }
    }
    
    console.log();
    await renderWindow(runner, windowSize);

    async function printLine(runner: KrakoanRunner, currAddr: number) {
      if (!Program) return;
      if (!Program?.code[currAddr]) return;

      const activeInst = await runner.decode(Program.code[currAddr]) as KrakoanInstruction;
      const isCurrent = currAddr === Registers['IP'];
      const pointer = isCurrent ? "  ==>  " : "       ";
      const opcode = activeInst?.type?.toString();

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
        process.stdout.write(`\x1b[32m${pointer}[${currAddr.toString().padStart(3, '0')}]: ${opcode} (${paramsList})\x1b[0m\n`);
      } else {
        console.log(`${pointer}[${currAddr.toString().padStart(3, '0')}]: ${opcode} (${paramsList})`);
      }
    }

    async function renderWindow(runner: KrakoanRunner, windowSize: number = 5) {
      if (!Program) return;
      
      const half = Math.floor(windowSize / 2);
      const totalInstructions = Object.keys(Program.code).length;
      
      let start = Math.max(0, Registers['IP'] - half);
      let end   = Math.min(totalInstructions - 1, start + windowSize - 1);
      
      if (end - start < windowSize - 1) {
        start = Math.max(0, end - windowSize + 1);
      }
      
      console.log(`--- 🪟 WINDOW: [${start.toString().padStart(3,'0')} - ${end.toString().padStart(3,'0')}] ---`);
      for (let index = start; index <= end; index++) {
        await printLine(runner, index);
      }
    }
  }
}
