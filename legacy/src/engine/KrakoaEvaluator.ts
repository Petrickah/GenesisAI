import type { KrakoanRunner } from "./KrakoaRunner.js";

/**
 * Evaluates a Lambda expression or a literal value within the given runner's context.
 * Uses a safe Proxy to expose designated context variables and look up the stack.
 * 
 * @param runner - The current VM instance.
 * @param id - An identifier for the evaluation (for logging/debugging).
 * @param value - The value to evaluate (can be a KrakoanLambda or a literal).
 * @returns The result of the evaluation.
 */
export function evalLambda(runner: KrakoanRunner, id: string, value: any): any {
  const stack = runner.DataStack;
  const currentBSP = runner.Registers.BSP;

  /**
   * Helper to find a property in the context stack following the __BSP chain
   * and falling back to a full stack search if needed.
   */
  function findInStack(prop: string, bsp: number): any {
    // 1. Try following the specific BSP chain (logical parents)
    let cursor = bsp;
    while (cursor >= 0) {
      const frame = stack[cursor];
      if (frame && prop in frame) return frame[prop];
      
      if (frame && typeof frame.__BSP === 'number' && frame.__BSP < cursor) {
        cursor = frame.__BSP;
      } else {
        break;
      }
    }

    // 2. Fallback: Search the entire stack in reverse (absolute parents)
    for (let i = stack.length - 1; i >= 0; i--) {
      const frame = stack[i];
      if (frame && prop in frame) return frame[prop];
    }

    return undefined;
  }

  // Create a safe proxy for the context to handle special cases like "Tags" and lookup
  const safeContext = new Proxy({}, {
    get: (_target, prop: string) => {
      if (prop === "Tags") {
        // For Tags, we might want to aggregate them or just find the first one
        const tags = findInStack("Tags", currentBSP);
        return new Proxy(tags || {}, {
          get: (t, p) => (p in t ? t[p] : false)
        });
      }
      return findInStack(prop, currentBSP);
    }
  });

  // If the value is a lambda object, execute its code
  if (value && typeof value === 'object' && value.type === ":lambda") {
    try {
      // Create a function from the lambda code
      // The context is passed as 'ctx' to the function
      const fn = new Function('ctx', value.code);
      const result = fn(safeContext);
      
      return result;
    } catch (e) {
      console.error(`❌ [Eval] Lambda Error for ${id}:`, e);
      return undefined;
    }
  }

  // Otherwise, return the literal value as-is
  return value;
}
