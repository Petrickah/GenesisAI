import { type KrakoanInfo, type KrakoanProgram, type KrakoanTags } from "../schema/krakoa.schema.js";

type InstructionOpcode = string;
type ExecutionHandler = (node: KrakoanInfo, runner: KrakoanRunner) => Promise<any>;

export class KrakoanRunner {
  public MaxCycles: number = 1;
  public InstructionPointer: number | undefined;
  public StackPointer: number = 0;
  public ContextStack: Array<Record<string, any>> = [];
  public IsRunning: boolean = false;
  public InternalState: Record<string, any> = {};
  public InstructionMap: Record<InstructionOpcode, ExecutionHandler> = {
    "👤": async (node, runner) => {
      const { id, name } = node.instruction.params;
      if (!runner.ContextStack[runner.StackPointer]) {
        runner.ContextStack.push({ id, name });
        runner.StackPointer++;
      }
    },
    "🔗": async (node, runner) => {
      const { id, tags } = node.instruction;
      const { mode } = node.instruction.params;

      if (!id || !tags || !mode) return;

      const retStateKey = `link@Return`;
      const curStateKey = runner.InternalState[retStateKey] ?? `link@${id}:${node.address}`;
      const retState = runner.InternalState[retStateKey] ?? curStateKey;
      const curState = runner.InternalState[curStateKey] ?? { currIndex: 0, address: node.address };

      switch(mode) {
        case "Return":
          const currContext = runner.ContextStack.pop();
          const prevContext = runner.ContextStack.pop();
          if (prevContext && currContext) {
            runner.ContextStack.push({
                ...prevContext,
                ...currContext,
                id: prevContext.id
            });
          } else if (currContext) {
            runner.ContextStack.push(currContext);
          }
          runner.StackPointer = runner.ContextStack.length;
          node.next = curState.address ?? node.next;
          return;
        case "Inheritance":
          const index = curState.currIndex as number;
          runner.InternalState[retStateKey] = retState;
          runner.InternalState[curStateKey] = curState;
          if (index < tags.length) {
            curState.currIndex++;
            node.next = tags[index]?.address ?? node.address;
            console.log(`🔗 [Link] Inheritance Jump to "${tags[index]?.original}":${tags[index]?.address} via ${curStateKey}`);
          }
          return;
      }
    },
    "🔃": async (node, runner) => {
      const targetId = node.instruction?.params.goto;
      const tags: KrakoanTags[] = node.instruction?.tags ?? [];
      const reference = tags.find((value) => value.target === targetId);
      if (reference?.address !== undefined) {
        node.next = reference.address;
        console.log(`🔃 [Jump] Jumped to ${targetId} at "${reference.original}":${reference.address}`);
      }
    },
type ContextType = Record<string, any>;
type ContextStackType = Array<ContextType>;
type ExecutionHandler = (node: KrakoanInfo, runner: KrakoanRunner) => Promise<boolean>;

export class KrakoanRunner {
  public Registers: ContextType = {};
  public ContextStack: ContextStackType = [];
  public InstructionMap: Record<InstructionOpcode, ExecutionHandler> = {
    "📌": async (node, runner) => {
      if (!node) return false;
      const { id, value } = node.instruction.params;
      const currentContext = runner.ContextStack[runner.StackPointer - 1];
      if (currentContext) {
        currentContext[id] = runner.evalLambda(id, value);
        console.log(`📌 [State] ${id} set to ${currentContext[id]} (via Lambda)`);
      }
    },
    "💬": async (node, runner) => {
      console.log(`💬 [Speech]: ${node.instruction?.params.content || node.instruction?.params.id}`);
    },
    "➔": async (node, runner) => {
      const inst = node.instruction;
      const triggerKey = `trigger_at_${node.address}`
      const pathPrimary = inst.next[0];
      const pathExit = inst.next[1];

      let state = runner.InternalState[triggerKey] || { cycleCount: 0 };
      if (state.cycleCount < runner.MaxCycles) {
        state.cycleCount++;
        node.next = pathPrimary ?? node.next;
      } else {
        node.next = pathExit ?? node.next;
      const currentFrame = runner.ContextStack[runner.Registers['BaseStackPointer']];
      if (currentFrame) {
        currentFrame[id] = value;
        console.log(`📌 [Set] ${id} = ${value} in Frame ${runner.Registers['BaseStackPointer']}`);
      }
      return true;
    },
    "⚓": async (node, runner) => {
      const { id, condition } = node.instruction.params;
      if (runner.evalLambda(id, condition)) {
        node.next = node.instruction.next[0] ?? node.next;
      } else {
        node.next = node.instruction.next[1] ?? node.next;
    "🔗": async (node, runner) => {
      if (!runner.Program || node?.instruction.id === undefined) return false;

      const { id } = node.instruction;
      const targetAddr = runner.Program.symbols[id];
      if (targetAddr !== undefined && targetAddr !== node.address) {
        const currentFrame = runner.ContextStack[runner.Registers['BaseStackPointer']];
        runner.Registers["IP"] = node.next;

        if (currentFrame) {
          currentFrame["__retAddr"] = node.next; 
        }
        runner.Registers["IP"] = targetAddr;
        console.log(`🚀 [Link] Jumping from ${node.address} to ${targetAddr}`);
        return true;
      }

      console.warn(`⚠️ [Link] Invalid jump target for ID: ${id}`);
      return false;
    }
  };

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
    return this.IsRunning;

    return true;
  }

  private evalLambda(id: string, value: any): any {
    const currContext = this.ContextStack[this.StackPointer - 1] ?? {};
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
    this.InstructionPointer = this.Program?.entry;
    this.IsRunning = false;
    this.ContextStack = [];
    if (this.Program === null) return;
    this.Registers['IP'] = this.Program.entry;
    this.Registers['Status'] = 'RUNNING';
    this.ContextStack = [];
    
    if (this.ContextStack.length === 0) {
      this.ContextStack.push({ metadata: { name: "ROOT_CONTEXT" } });
    }

    this.Registers['StackPointer'] = this.ContextStack.length - 1;
    this.Registers['BaseStackPointer'] = this.Registers['StackPointer'];
  }
}