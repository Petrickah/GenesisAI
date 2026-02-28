import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

/**
 * Handles contextual/structural instructions (👤, 🧠, 🧬)
 * Pushes a new context frame onto the stack.
 */
export default async (node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> => {
  const { id, params, type } = node.instruction;
  if (id === undefined) return false;

  // Signal to the parent Trigger that we are starting execution of this branch
  const parentContext = runner.DataStack[runner.Registers.BSP];
  if (parentContext && parentContext.__trigger) {
    parentContext.__isExecuting = true;
  }
  
  // Create a new context from parameters
  const newContext = {
    [id]: {
      ...params,
      __type: type,
      __address: node.address,
      __timestamp: Date.now()
    }
  };

  // Push to stack and update Stack Pointer
  runner.DataStack.push(newContext);
  runner.Registers.ESP = runner.DataStack.length - 1;

  // BSP (Base Stack Pointer) is intentionally NOT updated here.
  // It remains pointing to the Trigger frame that started this execution flow.
  
  return true;
};
