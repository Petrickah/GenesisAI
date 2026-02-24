import z from "zod";
import { KrakoanInfoSchema, type KrakoanInfo, type KrakoanProgram, type KrakoanTags } from "../schema/krakoa.schema.js";

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
};

type InstructionOpcode = typeof SNIPPETS[keyof typeof SNIPPETS];
type ExecutionHandler = (node: KrakoanInfo, runner: KrakoanRunner) => Promise<void>;

export class KrakoanRunner {
  public MaxCycles: number = 1;
  public InstructionPointer: number | undefined;
  public Context: Record<string, any> = {};
  public IsRunning: boolean = false;
  public InternalState: Record<string, any> = {};
  public InstructionMap: Record<InstructionOpcode, ExecutionHandler> = {
    "🔃": async (node, runner) => {
      const targetId = node.instruction?.params.goto;
      const tags: KrakoanTags[] = node.instruction?.tags ?? [];
      const reference = tags.find((value) => value.target === targetId);
      if (reference?.address !== undefined) {
        node.next = reference.address;
        console.log(`🚀 Jumped to ${targetId} at "${reference.original}":${reference.address}`);
      }
    },
    "📌": async (node, runner) => {
      runner.Context[node.instruction?.params.id] = node.instruction?.params.value;
    },
    "💬": async (node, runner) => {
      console.log(`💬 [Speech]: ${node.instruction?.params.content || node.instruction?.params.id}`);
    },
    "➔": async (node, runner) => {
      const inst = node.instruction;
      const triggerKey = `trigger_at_${node.address}`
      const pathPrimary = (inst.next && inst.next.length > 0) ? inst.next[0] : -1;
      const pathExit = (inst.next && inst.next.length > 1) ? inst.next[1] : -1;

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
    return true;
  }

  private async execute(node: KrakoanInfo) {
    const instructionCallback  = node.instruction?.type ? this.InstructionMap[node.instruction?.type] : undefined;
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
        if (key === "type") {
          newObject[key] = SNIPPETS[newObject[key]] ?? newObject[key];
        }
      }
      return newObject;
    }
    return value;
  }

  public reset() {
    this.InstructionPointer = this.Program?.entry;
    this.IsRunning = false;
    this.Context = {};
  }
}