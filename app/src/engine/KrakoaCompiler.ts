import { KrakoanNodeSchema, KrakoanProgramSchema, KrakoanTagsSchema, type KrakoanInstruction, type KrakoanNode, type KrakoanProgram } from '../schema/krakoa.schema.js';
import parser from '../grammar/grammar.cjs';

export function k(strings: TemplateStringsArray, ...values: any[]): KrakoanProgram | undefined {
  const input = strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");
  try {
    const ast = parser.parse(input);  
    return compile(KrakoanNodeSchema.array().parse(ast));
  } catch(error: any) {
    console.error(`⚠️ System error: ${error.location?.start.line || 0}:${error.location?.start.column || 0}: ${error.message}`);
  }
}

function compile(fullAST: KrakoanNode[]): KrakoanProgram {
  let firstTriggerIndex = -1;
  let instructions: KrakoanInstruction[] = [];
  const processedCode: Record<string, KrakoanInstruction> = {};

  function link(program: KrakoanProgram): KrakoanProgram {
    const textPool: string[] = [];
    const symbolMap: Record<string, number> = {};

    function process(value: any): any {
      if (!value) return undefined;
      if (Array.isArray(value)) return value.map(process);
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
        for (let k in value) {
          newObject[k] = process(value[k]);
        }
        return newObject;
      }
      return value;
    }

    function scanForHashTags(value: any, index: number): void {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        value.forEach((v) => scanForHashTags(v, index));
        return;
      }
      if (value.kind === 'hashtag' && value.root) {
        symbolMap[value.root] = index; // Înregistrăm locația hashtag-ului
      }
      for (const k in value) {
        scanForHashTags(value[k], index);
      }
    }

    function solveReference(value: any): any {
      if (!value) return undefined;
      if (Array.isArray(value)) return value.map(solveReference);
      if (typeof value === 'object' && value.kind === 'hashtag') {
        let lastAddress = -1;
        let lastReferenceID = value.root;
        for (const currReference in value.segments) {
          let currReferenceID = value.segments[currReference];
          lastAddress = symbolMap[currReferenceID] ?? -1;
          lastReferenceID = currReferenceID ?? value.root;
        }
        value = KrakoanTagsSchema.parse({
          ...value,
          original: `#${value.root}`,
          target: lastReferenceID,
          address: lastAddress
        });
        return value;
      }
      if (typeof value === 'object' && value.kind === 'reference') {
        let lastAddress = -1;
        let lastReferenceID = value.root;
        for (const currReference in value.segments) {
          let currReferenceID = value.segments[currReference];
          if (typeof currReferenceID === 'object' && currReferenceID.kind === 'hashtag') {
            currReferenceID = currReferenceID.root;
          }
          value.segments[currReference] = currReferenceID;
          if (Object.keys(symbolMap).indexOf(currReferenceID) === -1) {
            throw new Error(`Path Error: '${currReferenceID}' not found in the expected hierarchy.`);
          }
          lastReferenceID = currReferenceID ?? value.root;
          lastAddress = symbolMap[currReferenceID] ?? -1;
        }
        value = KrakoanTagsSchema.parse({
          ...value,
          original: `@${value.segments.join('::')}`,
          target: lastReferenceID,
          address: lastAddress
        });
        return value;
      }
      if (typeof value === 'object') {
        const newObject: any = {};
        for (let k in value)
          newObject[k] = solveReference(value[k]);
        return newObject;
      }
      
      return value;
    }

    if (program) {
      Object.entries(program.code).forEach(([index, currInstruction]) => {
        const addr = parseInt(index);
        if (currInstruction.id) {
          symbolMap[currInstruction.id] = addr;
        }
        scanForHashTags(currInstruction, addr);
      });
      const linkedCode = solveReference(program.code);
      for (const [addr, inst] of Object.entries(linkedCode)) {
        processedCode[addr] = process(inst); // Aici process returnează obiectul cu numere
      }
    }

    return KrakoanProgramSchema.parse({
      ...program,
      text: textPool,
      symbols: symbolMap,
      code: processedCode,
    });
  }

  function findNodeDeep(nodes: any[], targetId?: string): any {
    for (const node of nodes) {
      const nodeId = node.params?.id?.replace(/^[@#]/, '');
      const hasTag = node.tags?.some((t: any) => t.root?.replace(/^[@#]/, '') === targetId);
      if (nodeId === targetId || hasTag) return node;
      if (node.body && node.body.length > 0) {
        const foundInBody = findNodeDeep(node.body, targetId);
        if (foundInBody) return foundInBody;
      }
    }
    return null;
  }

  function verifyReference(segments: string[], forest: any[]): boolean {
    console.log("--- Semantic Check Start ---");
    let currentScope = findNodeDeep(forest, segments[0]?.replace(/^[@#]/, ''));
    if (!currentScope) {
      console.error(`❌ CRITICAL: Root segment '${segments[0]}' not found in forest!`);
      return false;
    }
    console.log(`Step 0: Found Root '${segments[0]}'. Navigating descendants...`);
    for (let i = 1; i < segments.length; i++) {
      const cleanSegment = segments[i]?.replace(/^[@#]/, '');
      const isTagOnCurrent = currentScope.tags?.some((t: any) => 
        t.root?.replace(/^[@#]/, '') === cleanSegment
      );
      if (isTagOnCurrent) {
        console.log(`✅ Step ${i}: Found '${cleanSegment}' as a Tag on current node.`);
        continue; // Trecem la următorul segment (dacă mai există)
      }
      const nextNode = currentScope.body?.find((node: any) => {
        const nodeId = node.params?.id?.replace(/^[@#]/, '');
        const hasTag = node.tags?.some((t: any) => t.root?.replace(/^[@#]/, '') === cleanSegment);
        console.log(`⏳ Verifying ${nodeId}: Segment Check ${cleanSegment}; Tags: ${JSON.stringify(hasTag)}`);
        return nodeId === cleanSegment || hasTag;
      });
      if (!nextNode) {
        console.error(`❌ CRITICAL: Could not find '${cleanSegment}' inside '${currentScope.params?.id || 'unnamed node'}'!`);
        return false;
      }
      console.log(`✅ Step ${i}: Found '${cleanSegment}'. Moving deeper...`);
      currentScope = nextNode;
    }
    return true;
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
        id: activeNode.params.id,
        type: activeNode.type,
        timestamp: Date.now(),
        params: activeNode.params,
        tags: activeNode.tags?.map((tag: any) => {
          if (tag.kind === 'reference') {
            // Validăm semantica: "Are acest drum logică în structura AST?"
            // Verificăm pornind de la rădăcina programului (bodyNodes original)
            const isValid = verifyReference(tag.segments, fullAST); 

            if (!isValid) {
              throw new Error(`Semantic Error: Reference path '@${tag.segments.join('::')}' is unreachable or invalid.`);
            }
          }
          return tag;
        }),
        next: [defaultNext]
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

  process(fullAST);

  return link(KrakoanProgramSchema.parse({
    code: { ...instructions },
    entry: firstTriggerIndex !== -1 ? firstTriggerIndex : 0,
  }));
}
