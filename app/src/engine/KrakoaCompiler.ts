import { KrakoanNodeSchema, KrakoanProgramSchema, type KrakoanInstruction, type KrakoanNode, type KrakoanProgram } from '../schema/krakoa.schema.js';
import parser from '../grammar/grammar.cjs';

export function k(strings: TemplateStringsArray, ...values: any[]): KrakoanProgram {
  const raw = strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");
  const ast = parser.parse(raw);
  
  return compile(KrakoanNodeSchema.array().parse(ast));
}

function compile(nodes: KrakoanNode[]): KrakoanProgram {
  let firstTriggerIndex = -1;
  let instructions: KrakoanInstruction[] = [];

  function link(program: KrakoanProgram): KrakoanProgram {
    const textPool: string[] = [];
    const symbolMap: Record<string, number> = {};

    function process(value: any): any {
      if (!value) return undefined;
      if (Array.isArray(value)) return value.map(process);
      else {
        if (typeof value === 'string') {
          let index = textPool.indexOf(value);
          if (index === -1) {
            index = textPool.length;
            textPool.push(value);
          }
          return index;
        }
        if (typeof value === 'object') {
          const newObject: any = {};
          for (let k in value)
            newObject[k] = process(value[k]);
          return newObject;
        }
      }
      return value;
    }

    if (program) {
      Object.entries(program.code).forEach(([index, currInstruction]) => {
        if (currInstruction.params.id) {
          symbolMap[currInstruction.params.id] = parseInt(index);
        }
      });
      Object.values(program.code).forEach(currInstruction => {
        currInstruction.params = process(currInstruction.params);
      });
    }

    return KrakoanProgramSchema.parse({
      ...program,
      text: textPool,
      symbols: symbolMap
    });
  }

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