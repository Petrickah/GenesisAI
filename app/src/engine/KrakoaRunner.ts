/**
 * Krakoa Virtual Machine Runner
 * 
 * A register-based VM that executes Krakoan IR.
 * Manages execution state, registers, and the contextual data stack.
 */

import { type KrakoanInfo, type KrakoanProgram } from "../schema/krakoa.schema.js";
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
  public ReturnStack: number[] = []; // Unified stack for non-linear flow control
  public Symbols: Record<string, any> = {}; // Global symbol storage for absorption
  
  /**
   * Mapping of functional tokens (emojis) to their execution logic.
   */
  public CommandTable: Record<InstructionOpcode, ExecutionHandler> = {
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
   * Registers a custom command handler (Plugin support).
   */
  public registerPlugin(opcode: InstructionOpcode, handler: ExecutionHandler): void {
    this.CommandTable[opcode] = handler;
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
    // We decode a CLONE so we don't pollute the original IR code
    const decodedInstruction = await this.decode(__raw.instruction);
    
    const node: KrakoanInfo = {
      address: __raw.address,
      next: __raw.next,
      instruction: decodedInstruction
    };

    const isExecuted = await this.execute(node);
    
    // Auto-increment IP ONLY if:
    // 1. The command returned true (success)
    // 2. The command DID NOT manually change the IP (e.g. it was not a Jump/Return)
    if (isExecuted && this.Registers["IP"] === node.address) {
      if (node.next !== -1) {
        this.Registers["IP"] = node.next;
      } else {
        this.Registers["Status"] = 'HALTED';
      }
    }

    return true;
  }

  /**
   * Dispatches the instruction to its corresponding opcode handler.
   * 
   * @param node - The current execution frame info.
   * @returns True if execution succeeded.
   */
  private async execute(node: KrakoanInfo) : Promise<boolean> {
    const { type } = node.instruction;
    if (type !== undefined) {
      const command = this.CommandTable[type];
      if (command) {
        return await command(node, this);
      }
      return true; // Unknown commands are treated as NO-OP
    }

    return false;
  }

  /**
   * Fetches the raw instruction from the program code at the current IP.
   */
  private fetch() : any {
    if (!this.Program) return null;
    const __currIP = this.Registers["IP"] as number;
    const currInstruction = this.Program.code[__currIP];
    if (currInstruction !== undefined) {
      return {
        next   : currInstruction.next[0] ?? -1,
        address: __currIP,
        instruction: { ...currInstruction }, // Shallow clone of instruction to prevent pollution
      }
    }

    return null;
  }

  /**
   * Decodes numerical indices back into their original string/object values
   * using the program's text pool.
   * 
   * @param value - The value to decode (can be recursive).
   * @param keyName - Optional key name to help skip pooling for instruction types.
   * @returns The decoded value.
   */
  public decode(value: any, keyName?: string): any {
    if (value === null || value === undefined || !this.Program) return;

    // Skip decoding for the instruction type to keep literal emojis
    if (keyName === 'type' && typeof value === 'string') return value;

    if (typeof value === 'number') return this.Program.text[value];
    if (Array.isArray(value)) return value.map(item => this.decode(item));
    if (typeof value === 'object') {
      if (value.type === ":lambda") return value;
      
      const newObject: Record<string, any> = {};
      for (let key in value) {
        newObject[key] = (key !== "address" && key !== "next" && key !== "original" && key !== "target") 
          ? this.decode(value[key], key)
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
    if (!this.Program) return;
    this.DataStack = [{}]; // Global context at index 0
    this.ReturnStack = []; // Reset Return Stack
    this.Symbols = {}; // Reset global symbol storage
    
    // Assign individually to preserve the Registers object reference
    this.Registers.IP = this.Program.entry;
    this.Registers.Status = 'RUNNING';
    this.Registers.ESP = 0;
    this.Registers.BSP = 0;
    this.Registers.CSP = 0;
  }
}
