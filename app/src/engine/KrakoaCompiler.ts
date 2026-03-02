/**
 * Krakoa Nexus DSL Compiler
 * 
 * Transforms Krakoan Script Language (.ksl) into an Intermediate Representation (IR).
 * Implements "Semantical Determinism" by anchoring LLM context into structured graphs.
 */

import { KrakoanLambdaSchema, KrakoanNodeSchema, KrakoanProgramSchema, KrakoanTagsSchema, type KrakoanInstruction, type KrakoanNode, type KrakoanProgram } from '../schema/krakoa.schema.js';
import parser from '../grammar/grammar.cjs';

/**
 * Template literal tag for Krakoan DSL.
 * Parses the input string and compiles it into a validated KrakoanProgram.
 * 
 * @param strings - The static parts of the template literal.
 * @param values - The dynamic interpolations.
 * @returns A compiled KrakoanProgram or undefined if parsing fails.
 */
export function k(strings: TemplateStringsArray, ...values: any[]): KrakoanProgram | undefined {
  const input = strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");
  try {
    const ast = parser.parse(input);  
    return compile(KrakoanNodeSchema.array().parse(ast));
  } catch(error: any) {
    console.error(`⚠️ System error: ${error.location?.start.line || 0}:${error.location?.start.column || 0}: ${error.message}`);
  }
}

/**
 * Compiles the Abstract Syntax Tree (AST) into a linked, instruction-based IR.
 * 
 * Phases:
 * 1. Linearization: Flattens the tree into a list of instructions with control flow pointers.
 * 2. Symbolic Linking: Resolves references (@Ref) and hashtags (#Tag) into instruction addresses.
 * 3. String Pooling: Optimizes memory by replacing static strings with numerical indices.
 * 
 * @param fullAST - The validated array of AST nodes.
 * @returns The final KrakoanProgram IR.
 */
function compile(fullAST: KrakoanNode[]): KrakoanProgram {
  let firstTriggerIndex = -1;
  let instructions: KrakoanInstruction[] = [];
  const processedCode: Record<string, KrakoanInstruction> = {};

  /**
   * Finalizes the program by solving references and pooling strings.
   * 
   * @param program - The intermediate program structure.
   * @returns The fully linked and pooled KrakoanProgram.
   */
  function link(program: KrakoanProgram): KrakoanProgram {
    const textPool: string[] = [];
    const symbolMap: Record<string, number> = {};

    /**
     * Recursively replaces strings with pool indices.
     * Skips Lambda objects to preserve executable code.
     */
    function process(value: any): any {
      if (value === undefined || value === null) return undefined;
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
        if (value.type === ':lambda' 
          || value.kind === 'hashtag'
          || value.kind === 'reference'
          || value.kind === 'state') return value;
        
        const newObject: any = {};
        for (let k in value) {
          newObject[k] = (k !== 'type') ? process(value[k]) : value[k];
        }
        return newObject;
      }
      return value;
    }

    /**
     * Scans instructions for hashtags to populate the global symbol map.
     */
    function scanForHashTags(value: any, index: number): void {
      if (value === undefined || value === null || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        value.forEach((v) => scanForHashTags(v, index));
        return;
      }
      if (value.kind === 'hashtag' && value.root) {
        symbolMap[value.root] = index; 
      }
      for (const k in value) {
        scanForHashTags(value[k], index);
      }
    }

    /**
     * Resolves symbolic paths into absolute instruction addresses using the symbol map.
     */
    function solveReference(value: any): any {
      if (value === undefined || value === null) return undefined;
      if (Array.isArray(value)) return value.map(solveReference);
      if (typeof value === 'object' && value.kind === 'hashtag') {
        let lastAddress = -1;
        let lastReferenceID = value.root;
        for (const currReference of value.segments) {
          let currReferenceID = typeof currReference === 'object' ? currReference.root : currReference;
          lastAddress = symbolMap[currReferenceID] ?? -1;
          lastReferenceID = currReferenceID ?? value.root;
        }
        return KrakoanTagsSchema.parse({
          ...value,
          original: `#${value.root}`,
          target: lastReferenceID,
          address: lastAddress
        });
      }
      if (typeof value === 'object' && value.kind === 'reference') {
        let lastAddress = -1;
        let lastReferenceID = value.root;
        const processedSegments = value.segments.map((currReference: any) => {
          const currReferenceID = typeof currReference === 'object' ? currReference.root : currReference;
          lastReferenceID = currReferenceID;
          lastAddress = symbolMap[currReferenceID] ?? -1;
          return currReferenceID;
        });

        return KrakoanTagsSchema.parse({
          ...value,
          segments: processedSegments,
          original: `@${processedSegments.join('::')}`,
          target: lastReferenceID,
          address: lastAddress
        });
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
        processedCode[parseInt(addr)] = process(inst);
      }
    }

    return KrakoanProgramSchema.parse({
      entry: program?.entry ?? 0,
      text: textPool,
      symbols: symbolMap,
      code: processedCode,
    });
  }

  /**
   * Traverses the AST forest to find a node by its ID or associated tags.
   */
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

  /**
   * Validates that symbolic references point to reachable nodes in the AST forest.
   * Prevents runtime reference errors in the VM.
   */
  function verifyReference(segments: string[], forest: any[]): boolean {
    let currentScope = findNodeDeep(forest, segments[0]?.replace(/^[@#]/, ''));
    if (!currentScope) {
      console.error(`❌ CRITICAL: Root segment '${segments[0]}' not found in forest!`);
      return false;
    }
    for (let i = 1; i < segments.length; i++) {
      const cleanSegment = segments[i]?.replace(/^[@#]/, '');
      const isTagOnCurrent = currentScope.tags?.some((t: any) => 
        t.root?.replace(/^[@#]/, '') === cleanSegment
      );
      if (isTagOnCurrent) continue;
      const nextNode = currentScope.body?.find((node: any) => {
        const nodeId = node.params?.id?.replace(/^[@#]/, '');
        const hasTag = node.tags?.some((t: any) => t.root?.replace(/^[@#]/, '') === cleanSegment);
        return nodeId === cleanSegment || hasTag;
      });
      if (!nextNode) {
        console.error(`❌ CRITICAL: Could not find '${cleanSegment}' inside '${currentScope.params?.id || 'unnamed node'}'!`);
        return false;
      }
      currentScope = nextNode;
    }
    return true;
  }

  /**
   * Core linearization loop.
   * Flattens nested AST nodes into a flat instruction list with jump pointers for branching.
   * 
   * Now implements Sentinel (🏁) insertion at the end of every block.
   */
  function linearize(bodyNodes: Record<string, any>[], exitIndex?: number): void {
    bodyNodes.forEach((activeNode, index) => {
      const currentIndex = instructions.length;
      const isLastNode = index === bodyNodes.length - 1;

      const currInstruction: KrakoanInstruction = {
        id: activeNode.params.id,
        type: activeNode.type,
        timestamp: Date.now(),
        params: { ...activeNode.params },
        tags: activeNode.tags?.map((tag: any) => {
          if (tag.kind === 'reference') {
            const isValid = verifyReference(tag.segments, fullAST); 
            if (!isValid) {
              throw new Error(`Semantic Error: Reference path '@${tag.segments.join('::')}' is unreachable or invalid.`);
            }
          }
          return tag;
        }),
        next: []
      };

      if (activeNode.type === '➔' && exitIndex === undefined && firstTriggerIndex === -1) {
        firstTriggerIndex = currentIndex;
      }

      instructions.push(currInstruction);

      let sentinelAddr: number | undefined;
      let bodyStart: number | undefined;

      if (activeNode.body && activeNode.body.length > 0) {
        bodyStart = instructions.length;
        const sentinelPlaceholder = -1;
        
        linearize(activeNode.body, sentinelPlaceholder);
        
        sentinelAddr = instructions.length;
        // Patch body instructions that pointed to the placeholder to point to the sentinel
        for (let j = bodyStart; j < sentinelAddr; j++) {
          const bodyInstruction = instructions[j];
          if (bodyInstruction && bodyInstruction.next.includes(sentinelPlaceholder)) {
            bodyInstruction.next = bodyInstruction.next.map(n => sentinelAddr !== undefined && n === sentinelPlaceholder ? sentinelAddr : n);
          }
        }

        const isTrigger = activeNode.type === '➔';
        const isStructural = ['👤', '🧠', '📦', '📑'].includes(activeNode.type);
        const sentinelParams: Record<string, any> = { nest: isStructural };
        if (isTrigger && bodyStart !== undefined) sentinelParams.bodyAddr = bodyStart;

        instructions.push({
          id: `@sentinel:${currentIndex}`,
          type: '🏁',
          timestamp: Date.now(),
          params: sentinelParams,
          next: [] // Will be patched below
        });
      } else if (activeNode.type === '➔') {
        sentinelAddr = instructions.length;
        instructions.push({
          id: `@sentinel:${currentIndex}`,
          type: '🏁',
          timestamp: Date.now(),
          params: { nest: false, bodyAddr: currentIndex }, // Trigger with no block still points back to itself or should it point back? User said: "one that points back to the trigger"
          next: [] // Will be patched below
        });
      }

      // Determine where the next instruction/sibling should be.
      // If last node, go to parent's exitIndex. If top-level, use program end.
      const afterSubtreeAddr = isLastNode ? (exitIndex ?? instructions.length) : instructions.length;

      // Patch the Sentinel's next addresses
      if (sentinelAddr !== undefined) {
        const sentinel = instructions[sentinelAddr];
        if (sentinel !== undefined) {
          if (activeNode.type === '➔') {
            sentinel.next = [afterSubtreeAddr, currentIndex];
          } else {
            sentinel.next = [afterSubtreeAddr];
          }
        }
      }

      // Patch the current instruction's next addresses
      if (activeNode.body && activeNode.body.length > 0) {
        if (activeNode.type === '➔') {
          // Trigger with block: [bodyStart, exitAddr, sentinelAddr]
          currInstruction.next = [bodyStart!, afterSubtreeAddr, sentinelAddr!];
        } else if (activeNode.type === '⚓') {
          currInstruction.next = [bodyStart!, afterSubtreeAddr];
        } else {
          // Normal container: [bodyStart]
          currInstruction.next = [bodyStart!];
        }
      } else {
        if (activeNode.type === '➔') {
          // Trigger without block: [exitAddr, sentinelAddr]
          currInstruction.next = [afterSubtreeAddr, sentinelAddr!];
        } else {
          // Leaf node: [exitAddr]
          currInstruction.next = [afterSubtreeAddr];
        }
      }
    });
  }

  linearize(fullAST);

  return link(KrakoanProgramSchema.parse({
    code: { ...instructions },
    entry: firstTriggerIndex !== -1 ? firstTriggerIndex : 0,
  }));
}
