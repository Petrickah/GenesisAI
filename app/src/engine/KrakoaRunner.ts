import { type KrakoanInfo, type KrakoanInfoNullable, type KrakoanProgram } from "../schema/krakoa.schema.js";
import Inheritance from "./opcodes/Inheritance.js";
import Speech from "./opcodes/Speech.js";
import Trigger from "./opcodes/Trigger.js";

export type InstructionOpcode = string | number;
export type ContextType = Record<string, any>;
export type ContextStackType = Array<ContextType>;
export type ExecutionHandler = (node: KrakoanInfo, runner: KrakoanRunner) => Promise<boolean>;

export class KrakoanRunner {
  public Registers: ContextType = {};
  public DataStack: ContextStackType = [];
  public InstructionMap: Record<InstructionOpcode, ExecutionHandler> = {
    "➔": Trigger,
    "🔗": Inheritance,
    "💬": Speech,
    "📡": Speech,
  }

  constructor(public Program: KrakoanProgram ) {
    this.reset();
  }

  public async step(): Promise<boolean> {
    if (!this.Program || this.Registers["Status"] !== 'RUNNING') return false;

    const __raw = this.fetch();
    if (!__raw) return false;

    __raw.instruction = await this.decode(__raw.instruction);
    if (!await this.execute(__raw)) {
      console.error(`❌ Instruction Error for ${__raw.address}`);
    }
    
    const lastInstruction = Object.keys(this.Program?.code).length;
    if (this.Registers["IP"] === __raw.address) {
      if (__raw.next < lastInstruction) {
        this.Registers["IP"] = __raw.next;
      } else {
        this.Registers["Status"] = 'HALTED';
      }
    }

    return true;
  }

  private evalLambda(id: string, value: any): any {
    const currContext = this.DataStack[this.Registers['StackPointer']] ?? {};
    const safeContext = new Proxy(currContext, {
      get: (target, prop: string) => {
        if (prop === "Tags") {
          return new Proxy(target["Tags"] || {}, {
            get: (t, p) => (p in t ? t[p] : false)
          });
        }
        return target[prop];
      }
    });
    if (value && value.type === ":lambda") {
      try {
        const fn = new Function('ctx', value.code);
        const result = fn(safeContext)
        console.log(`🔍 Evaling Lambda for ${id}. Context keys: ${Object.keys(safeContext)} Result: ${result}`);
        return result;
      } catch (e) {
        console.error(`❌ Lambda Error for ${id}:`, e);
        return undefined;
      }
    } else {
      return value;
    }
  }

  private async execute(node: KrakoanInfo) : Promise<boolean> {
    const { type } = node.instruction;
    if (type !== undefined) {
      const callback = this.InstructionMap[type];
      const result = callback ? await callback(node, this) : true;
  
      if (result) {
        const currentBSP = this.Registers.BSP;
        const parentContext = this.DataStack[currentBSP];
    
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

  private fetch() : KrakoanInfoNullable {
    if (this.Program === null) return null;
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

  public decode(value: any): any {
    if (value === null || value === undefined || !this.Program) return;
    if (typeof value === 'number') return this.Program.text[value];
    if (Array.isArray(value)) return value.map(item => this.decode(item));
    if (typeof value === 'object') {
      // Don't decode Lambda objects, they are used as is in evalLambda
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

  public reset() {
    if (this.Program === null) return;
    this.DataStack = [];
    this.Registers['IP'] = this.Program.entry;
    this.Registers['Status'] = 'RUNNING';
    this.Registers['ESP'] = this.DataStack.length - 1;
    this.Registers['BSP'] = this.Registers['ESP'];
  }
}
