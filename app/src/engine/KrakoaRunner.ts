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
    "📌": async (node, runner) => {
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
      }

      runner.InternalState[triggerKey] = state;
      console.log(`➔ [Trigger ID: ${triggerKey}] @${node.address} | Cycle: ${state.cycleCount}/${runner.MaxCycles} | Next: ${node.next}`);
    },
    "⚓": async (node, runner) => {
      const { id, condition } = node.instruction.params;
      if (runner.evalLambda(id, condition)) {
        node.next = node.instruction.next[0] ?? node.next;
      } else {
        node.next = node.instruction.next[1] ?? node.next;
      }
    }
  };

  constructor(public Program: KrakoanProgram | undefined) {
    this.reset();
    this.IsRunning = true;
  }

  public async step(): Promise<boolean> {
    if (!this.Program || !this.IsRunning || this.InstructionPointer === undefined) return false;

    const rawInstruction = this.fetch();
    rawInstruction.instruction = this.decode(rawInstruction?.instruction);
    await this.execute(rawInstruction);

    if (rawInstruction && rawInstruction.next !== -1) {
      this.InstructionPointer = rawInstruction.next;
    } else {
      this.IsRunning = false;
    }
    return this.IsRunning;
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
      } catch (e) {
        console.error(`❌ Lambda Error for ${id}:`, e);
        return undefined;
      }
    } else {
      return value;
    }
  }

  private async execute(node: KrakoanInfo) {
    const instructionCallback = node.instruction?.type ? this.InstructionMap[node.instruction?.type] : undefined;
    return instructionCallback ? await instructionCallback(node, this) : undefined;
  }

  private fetch() : KrakoanInfo {
    const currInstruction = this.Program!.code[this.InstructionPointer!]!;
    const prevInstruction = this.InstructionPointer!;
    const nextInstruction = currInstruction?.next[0];

    return {
      address: prevInstruction,
      instruction: currInstruction,
      next: nextInstruction ?? -1
    }
  }

  public decode(value: any): any {
    if (!value || !this.Program) return;
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
    this.InstructionPointer = this.Program?.entry;
    this.IsRunning = false;
    this.ContextStack = [];
  }
}