import type { KrakoanProgram, KrakoanInstruction } from "../schema/krakoa.schema.js";

export interface KrakoanInfo {
  address: number,
  instruction?: KrakoanInstruction | undefined,
  next?: number | undefined
};

export class KrakoanRunner {
  public InstructionPointer: number | undefined;
  public Context: Record<string, any> = {};
  public IsRunning: boolean = false;

  constructor(public Program: KrakoanProgram | undefined) {
    this.reset();
  }

  public fetch() : KrakoanInfo | undefined {
    if (!this.Program) return undefined;
    if (typeof this.InstructionPointer === 'undefined') return undefined;
    
    const currInstruction = this.Program.code[this.InstructionPointer];
    if (!currInstruction) {
      this.InstructionPointer = undefined;
      return undefined;
    }

    const prevInstruction = this.InstructionPointer;
    const nextInstruction = (currInstruction.next.length > 0) ? currInstruction.next[0] : -1;
    this.InstructionPointer = (nextInstruction !== -1) ? nextInstruction : undefined;

    return {
      address: prevInstruction,
      instruction: currInstruction,
      next: this.InstructionPointer
    }
  }

  public reset() {
    this.InstructionPointer = this.Program?.entry;
    this.Context = {};
  }
}