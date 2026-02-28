import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";
import { evalLambda } from "../KrakoaEvaluator.js";

/**
 * Handles contextual/structural instructions (👤, 🧠, 🧬, 📌, 📂, etc.)
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
  
  // Dynamically evaluate parameters (Lambdas) before storage
  const evaluatedParams: Record<string, any> = {};
  for (const key in params) {
    evaluatedParams[key] = evalLambda(runner, `${id}.${key}`, params[key]);
  }

  // Create a new context from evaluated parameters
  const contextData = {
    ...evaluatedParams,
    __type: type,
    __address: node.address,
    __timestamp: Date.now()
  };

  const newContext = {
    [id]: contextData
  };

  // Store in global symbols for absorption
  runner.Symbols[id] = contextData;

  // If this is a state (📌) or data (📂) node, also merge directly into frame
  if (type === "📌" || type === "📂") {
    const val = evaluatedParams.value || evaluatedParams.content || evaluatedParams;
    newContext[id] = val;
  }

  // Push to stack and update Stack Pointer
  runner.DataStack.push(newContext);
  runner.Registers.ESP = runner.DataStack.length - 1;

  // BSP (Base Stack Pointer) is intentionally NOT updated here.
  // It remains pointing to the Trigger frame that started this execution flow.
  
  return true;
};
