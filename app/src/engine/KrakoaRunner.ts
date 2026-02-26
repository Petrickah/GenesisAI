import { type KrakoanInfo, type KrakoanProgram, type KrakoanTags } from "../schema/krakoa.schema.js";

type InstructionOpcode = string;
type ContextType = Record<string, any>;
type ContextStackType = Array<ContextType>;
type ExecutionHandler = (node: KrakoanInfo, runner: KrakoanRunner) => Promise<boolean>;

export class KrakoanRunner {
  public Registers: ContextType = {};
  public ContextStack: ContextStackType = [];
  public InstructionMap: Record<InstructionOpcode, ExecutionHandler> = {

  };

  constructor(public Program: KrakoanProgram ) {
    this.reset();
  }

  public async step(): Promise<boolean> {
    if (!this.Registers["IsRunning"]) return false;

    const __raw = this.fetch();
    if (!__raw) return false;

    __raw.instruction = await this.decode(__raw.instruction);

    if (!await this.execute(__raw)) {
      console.error(`❌ Instruction Error for ${__raw.address}`);
      return false;
    }

    if (__raw.next !== -1) {
      this.Registers["IP"] = __raw.next;
    } else {
      this.Registers["IsRunning"] = false;
    }

    return true;
  }

  private evalLambda(id: string, value: any): any {
    if (value && value.type === ":lambda") {
      try {
        const fn = new Function('ctx', value.code);
        console.log(`🔍 Evaling Lambda for ${id}. Context keys:`, Object.keys({}));
        return fn({});
      } catch (e) {
        console.error(`❌ Lambda Error for ${id}:`, e);
        return undefined;
      }
    } else {
      return value;
    }
  }

  private async execute(node: KrakoanInfo) : Promise<boolean> {
    if (typeof node?.instruction.type !== 'string') {
      return false;
    }
    
    const { type } = node.instruction;
    const callback = this.InstructionMap[type];
    if (callback === undefined) {
      return false;
    }

    return callback(node, this);
  }

  private fetch() : KrakoanInfo {
    if (this.Program !== null) {
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
    }
    return null;
  }

  public async decode(value: any): Promise<any> {
    if (value === null || value === undefined || !this.Program) return;
    if (typeof value === 'number') return this.Program.text[value];
    if (Array.isArray(value)) return value.map(async item => await this.decode(item));
    if (typeof value === 'object') {
      const newObject: Record<string, any> = {};
      for (let key in value) {
        newObject[key] = (key !== "address" && key !== "next") 
          ? await this.decode(value[key])
          : value[key];
      }
      return newObject;
    }
    return value;
  }

  public reset() {
    if (this.Program === null) return;
    this.Registers['IP'] = this.Program.entry;
    this.Registers['IsRunning'] = true;
    this.Registers['StackPointer'] = this.ContextStack.length - 1;
    this.Registers['BaseStackPointer'] = this.Registers['StackPointer'];
    this.ContextStack = [];
  }
}