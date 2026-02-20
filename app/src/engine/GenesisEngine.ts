import parser from '../grammar/grammar.cjs';
import { KrakoanNodeSchema, KrakoanProgramSchema, type KrakoanInstruction, type KrakoanNode, type KrakoanProgram } from '../schema/krakoa.schema.js';

export interface AgentState {
  name: string;
  hp: number;
  stress: number;
  inventory: string[];
}

export function k(strings: TemplateStringsArray, ...values: any[]): KrakoanProgram {
  const raw = strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");
  const ast = parser.parse(raw);
  
  // return KrakoanNodeSchema.array().parse(ast);
  return compile(KrakoanNodeSchema.array().parse(ast));
}

function link(program: KrakoanProgram): KrakoanProgram {
  const textPool: string[] = [];
  const symbolMap: Record<string, number> = {};

  if (program) {
    Object.entries(program.code).forEach(([index, currInstruction]) => {
      if (currInstruction.params.id) {
        symbolMap[currInstruction.params.id] = parseInt(index);
      }
    });
  }

  function processValue(value: any): any {
    if (typeof value === 'string') {
      let index = textPool.indexOf(value);
      if (index === -1) {
        index = textPool.length;
        textPool.push(value);
      }

      return index;
    }

    if (value && typeof value === 'object' && value.kind === 'reference') {
      return {
        ...value,
        resolvedAddress: symbolMap[value.target] ?? -1
      }
    }

    if (Array.isArray(value)) return value.map(processValue);
    if (value && typeof value === 'object') {
      const newObject: any = {};
      for (let k in value)
        newObject[k] = processValue(value[k]);
      return newObject;
    }

    return value;
  }

  if (program) {
    Object.values(program.code).forEach(currInstruction => {
      currInstruction.params = processValue(currInstruction.params);
    });
  }

  return KrakoanProgramSchema.parse({
    ...program,
    text: textPool,
    symbols: symbolMap
  });
}

function compile(nodes: KrakoanNode[]): KrakoanProgram {
  let instructions: KrakoanInstruction[] = [];
  let firstTriggerIndex = -1;

  function process(bodyNodes: Record<string, any>[], returnIndex?: number): void {
    bodyNodes.forEach((activeNode, index) => {
      const currentIndex = instructions.length;
      const isLastInstruction = index === bodyNodes.length - 1;

      let defaultNext: number = isLastInstruction ? (returnIndex ?? -1) : currentIndex + 1;

      if (activeNode.type === ':trigger' && !returnIndex && firstTriggerIndex === -1) {
        firstTriggerIndex = currentIndex;
      }

      const currInstruction = {
        type: activeNode.type,
        params: activeNode.params,
        next: [defaultNext],
      }

      instructions.push(currInstruction);

      if (activeNode.body && activeNode.body.length > 0) {
        const bodyStartIndex = instructions.length;

        if (activeNode.type === ':trigger') {
          process(activeNode.body, currentIndex); 
          const exitIndex = instructions.length;
          currInstruction.next = [bodyStartIndex, exitIndex];
        } 
        else {
          process(activeNode.body, defaultNext);
          
          if (activeNode.type === ':anchor') {
            const exitIndex = instructions.length;
            currInstruction.next = [bodyStartIndex, exitIndex];
          } else {
            currInstruction.next = [bodyStartIndex];
          }
        }
      } else {
        currInstruction.next = [defaultNext];
      }

      if (isLastInstruction) {
        defaultNext = instructions.length;
        // Și trebuie să actualizăm manual inst.next dacă nu a fost setat de body
        if (!activeNode.body || activeNode.body.length === 0) {
          currInstruction.next = [instructions.length];
        }
      }
    });
  }

  process(nodes);

  return link(KrakoanProgramSchema.parse({
    code: { ...instructions },
    entry: firstTriggerIndex !== -1 ? firstTriggerIndex : 0,
  }));
}