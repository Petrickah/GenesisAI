import { type KrakoanInfo, type KrakoanProgram, type KrakoanTags } from "../schema/krakoa.schema.js";

type InstructionOpcode = string;
type ContextType = Record<string, any>;
type ContextStackType = Array<ContextType>;
type ExecutionHandler = (node: KrakoanInfo, runner: KrakoanRunner) => Promise<boolean>;

async function handleReturn(runner: KrakoanRunner): Promise<boolean> {
  const currentFrame = runner.DataStack[runner.Registers.ESP];
  if (currentFrame) {
    const tags = currentFrame["__tags"];
    let index = currentFrame["__tagIndex"];
  
    currentFrame[`mock_data_from_tag_${index}`] = "✓ COMPLETED";
    if (tags && index + 1 < tags.length) {
      currentFrame["__tagIndex"] = ++index;
      
      const nextTag = tags[index] as KrakoanTags;
      const nextTargetAddr = nextTag.address;
  
      if (nextTargetAddr !== undefined) {
        runner.Registers["IP"] = nextTargetAddr;
        console.log(`🔄 [Return] Tag ${index-1} done. Moving to next: ${nextTag} at ${nextTargetAddr}`);
        return true;
      }
    }
  
    const finalAddr = currentFrame["__finalRetAddr"];
    if (finalAddr !== undefined) {
      runner.Registers["IP"] = finalAddr;
      console.log(`🏁 [Return] All tags completed. Returning to main flow at ${finalAddr}`);
      
      delete currentFrame["__tags"];
      delete currentFrame["__tagIndex"];
      delete currentFrame["__finalRetAddr"];
      return true;
    }
  }

  return false;
}

async function handleInheritance(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  if (!runner.DataStack[runner.Registers.ESP]) {
    runner.DataStack.push({});
    runner.Registers.ESP = runner.DataStack.length - 1;
  }

  const currentFrame = runner.DataStack[runner.Registers.ESP];
  const { tags } = node?.instruction ?? {};

  if (currentFrame && tags && tags.length > 0) {
    currentFrame["__tags"] = tags;
    currentFrame["__tagIndex"] = 0;
    currentFrame["__finalRetAddr"] = node?.next;
    const firstTag = tags[0] as KrakoanTags;
    const targetAddr = firstTag.address;

    if (targetAddr !== undefined) {
      runner.Registers["IP"] = targetAddr;
      console.log(`🚀 [Inheritance] Start list. Jumping to 1st tag: "${firstTag.original}" at ${targetAddr}`);
      return true;
    }
  }

  return false;
}

export class KrakoanRunner {
  public Registers: ContextType = {};
  public DataStack: ContextStackType = [];
  public InstructionMap: Record<InstructionOpcode, ExecutionHandler> = {
    "🔗": async (node, runner) => {
      if (!node) return false;
      const mode = node.instruction.params.mode as string;

      switch (mode) {
        case "Inheritance":
          return await handleInheritance(node, runner);
        case "Return":
          return await handleReturn(runner);
        default:
          return false;
      }
    }
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

  public decode(value: any): any {
    if (value === null || value === undefined || !this.Program) return;
    if (typeof value === 'number') return this.Program.text[value];
    if (Array.isArray(value)) return value.map(item => this.decode(item));
    if (typeof value === 'object') {
      const newObject: Record<string, any> = {};
      for (let key in value) {
        newObject[key] = (key !== "address" && key !== "next") 
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
  }
}
