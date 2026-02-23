import type { KrakoanProgram, KrakoanInstruction } from "../schema/krakoa.schema.js";

export interface KrakoanInfo {
  address: number,
  instruction: KrakoanInstruction,
  next: number
};

export class KrakoanRunner {
  public InstructionPointer: number | undefined;
  public Context: Record<string, any> = {};
  public IsRunning: boolean = false;

  constructor(public Program: KrakoanProgram | undefined) {
    this.reset();
    this.IsRunning = true;
  }

  public step(): boolean {
    if (!this.Program || !this.IsRunning || this.InstructionPointer === undefined) return false;

    const rawInstruction = this.fetch();
    const instruction = this.decode(rawInstruction?.instruction);
    this.execute(instruction);
    // if (rawInstruction && rawInstruction.next && rawInstruction.next !== -1) {
    //   this.InstructionPointer = rawInstruction.next;
    // } else {
    //   this.IsRunning = false;
    // }
    return true;
  }

  private execute(instr?: KrakoanInstruction) {
    if (!instr) return;
    switch (instr.type) {
      case ':state':
        this.Context[instr.id!] = instr.params.value;
        console.log(`[EXEC]: State '${instr.id}' updated to:`, instr.params.value);
        break;
      // case ':lambda':
      //   const fn = new Function('ctx', node.params.code);
      //   break;
    }
  }

  private fetch() : KrakoanInfo | undefined {
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

  public decode(value: any): KrakoanInstruction | undefined {
    if (!value || !this.Program) return undefined;
    if (typeof value === 'number') {
      return this.Program.text[value];
    }
    if (typeof value === 'object') {
      const newObject: Record<string, any> = {};
      for (let key in value) {
        newObject[key] = this.decode(value[key]);
      }
      return newObject as KrakoanInstruction;
    }
    return value;
  }

  public reset() {
    this.InstructionPointer = this.Program?.entry;
    this.IsRunning = false;
    this.Context = {};
  }
}