import type { KrakoanProgram, KrakoanInstruction } from "../schema/krakoa.schema.js";

export interface KrakoanInfo {
  address: number,
  instruction: KrakoanInstruction ,
  next: number
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
      instruction: this.decode(currInstruction) as KrakoanInstruction,
      next: this.InstructionPointer ?? -1
    }
  }

  public decode(value: any): any {
    if (!this.Program) return undefined;
    if (value && typeof value === 'number') {
      return this.Program.text[value];
    }
    if (value && typeof value === 'object') {
      const newObject: Record<string, string> = {};
      for (let key in value) {
        newObject[key] = this.decode(value[key]);
      }
      return newObject;
    }
    return value;
  }

  public reset() {
    this.InstructionPointer = this.Program?.entry;
    this.Context = {};
  }
}