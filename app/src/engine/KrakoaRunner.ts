/**
 * Krakoa Virtual Machine Runner
 * 
 * A register-based VM that executes Krakoan IR.
 * Manages execution state, registers, and the contextual data stack.
 */

import { type KrakoanInfo, type KrakoanInfoNullable, type KrakoanProgram } from "../schema/krakoa.schema.js";
import Inheritance from "./opcodes/Inheritance.js";
import Speech from "./opcodes/Speech.js";
import Trigger from "./opcodes/Trigger.js";
import Contextual from "./opcodes/Contextual.js";

export type InstructionOpcode = string | number;
export type ContextType = Record<string, any>;
export type ContextStackType = Array<ContextType>;

/**
 * Type definition for opcode execution handlers.
 */
export type ExecutionHandler = (node: KrakoanInfo, runner: KrakoanRunner) => Promise<boolean>;

/**
 * The KrakoanRunner class implements the execution engine for the DSL.
 * 
 * Registers:
 * - IP: Instruction Pointer
 * - Status: Current VM status (RUNNING, HALTED, etc.)
 * - ESP: Stack Pointer (top of the context stack)
 * - BSP: Base Stack Pointer (locked to the current Trigger frame)
 */
export class KrakoanRunner {
  public Registers: ContextType = {};
  public DataStack: ContextStackType = [];
  public Symbols: Record<string, any> = {}; // Global symbol storage for absorption
  
  /**
   * Mapping of functional tokens (emojis) to their execution logic.
   */
  public InstructionMap: Record<InstructionOpcode, ExecutionHandler> = {
    "➔": Trigger,
    "🔗": Inheritance,
    "💬": Speech,
    "📡": Speech,
    "👤": Contextual,
    "🧠": Contextual,
    "🧬": Contextual,
    "📌": Contextual,
    "📂": Contextual,
    "🧩": Contextual,
    "📑": Contextual,
    "🔓": Contextual,
    "🩺": Contextual,
    "💉": Contextual,
    "🛡️": Contextual,
    "🚀": Contextual,
    "🎭": Contextual,
    "📦": Contextual,
  }

  /**
   * Initializes the runner with a compiled program.
   * @param Program - The KrakoanProgram IR to execute.
   */
  constructor(public Program: KrakoanProgram) {
    this.reset();
  }

  /**
   * Executes a single instruction at the current Instruction Pointer.
   * Handles decoding of pooled values and updates the IP.
   * 
   * @returns A promise resolving to true if execution can continue, false otherwise.
   */
  public async step(): Promise<boolean> {
    if (!this.Program || this.Registers["Status"] !== 'RUNNING') return false;

    const __raw = this.fetch();
    if (!__raw) return false;

    // Decode numerical indices back into their text/object values before execution
    __raw.instruction = await this.decode(__raw.instruction);
    
    if (!await this.execute(__raw)) {
      console.error(`❌ Instruction Error for ${__raw.address}`);
    }
    
    const lastInstruction = Object.keys(this.Program?.code).length;
    
    // Auto-increment IP if it wasn't modified by the instruction handler (e.g., by a Jump)
    if (this.Registers["IP"] === __raw.address) {
      if (__raw.next < lastInstruction) {
        this.Registers["IP"] = __raw.next;
      } else {
        this.Registers["Status"] = 'HALTED';
      }
    }

    return true;
  }

  /**
   * Dispatches the instruction to its corresponding opcode handler.
   * Also handles implicit returns for Trigger-based scopes.
   * 
   * @param node - The current execution frame info.
   * @returns True if execution succeeded.
   */
  private async execute(node: KrakoanInfo) : Promise<boolean> {
    const { type } = node.instruction;
    if (type !== undefined) {
      const callback = this.InstructionMap[type];
      const result = callback ? await callback(node, this) : true;
  
      if (result) {
        const currentBSP = this.Registers.BSP;
        const parentContext = this.DataStack[currentBSP];
    
        // Logic for "Implicit Return": If a child instruction finishes and no further 
        // instructions are executing in its branch, return IP to the parent Trigger.
        const isValidTrigger = node 
          && parentContext
          && parentContext.__trigger 
          && parentContext.__retAddress === (node.address - 1);
  
        if (isValidTrigger && !parentContext.__isExecuting) {
          this.Registers.IP = parentContext.__retAddress;
        }
  
        return true;
      }
    }

    return false;
  }

  /**
   * Fetches the raw instruction from the program code at the current IP.
   */
  private fetch() : KrakoanInfoNullable {
    if (this.Program === null || this.Program === undefined) return null;
    const __currIP = this.Registers["IP"] as number;
    const currInstruction = this.Program.code[__currIP];
    if (currInstruction !== undefined) {
      const __nextIP = currInstruction.next[0] ?? -1;
      return {
        next   : __nextIP,
        address: __currIP,
        instruction: currInstruction,
      }
    }

    return null;
  }

  /**
   * Decodes numerical indices back into their original string/object values
   * using the program's text pool.
   * 
   * @param value - The value to decode (can be recursive).
   * @returns The decoded value.
   */
  public decode(value: any): any {
    if (value === null || value === undefined || !this.Program) return;
    if (typeof value === 'number') return this.Program.text[value];
    if (Array.isArray(value)) return value.map(item => this.decode(item));
    if (typeof value === 'object') {
      if (value.type === ":lambda") return value;
      
      const newObject: Record<string, any> = {};
      for (let key in value) {
        newObject[key] = (key !== "address" && key !== "next" && key !== "original" && key !== "target") 
          ? this.decode(value[key])
          : value[key];
      }
      return newObject;
    }
    return value;
  }

  /**
   * Resets the VM state to its initial configuration.
   * Sets the IP to the program's entry point and clears the stack.
   */
  public reset() {
    if (this.Program === null || this.Program === undefined) return;
    this.DataStack = [{}]; // Global context at index 0
    this.Symbols = {}; // Reset global symbol storage
    this.Registers['IP'] = this.Program.entry;
    this.Registers['Status'] = 'RUNNING';
    this.Registers['ESP'] = 0;
    this.Registers['BSP'] = 0;
  }
}
