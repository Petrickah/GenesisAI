import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";
import { evalLambda } from "../KrakoaEvaluator.js";

async function handleConcept(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  const { id } = node.instruction.params || {};
  const currentContext = runner.DataStack[runner.Registers.ESP] as any;

  if (id && typeof id === 'string' && currentContext) {
    if (!currentContext[id]) {
      // Look for an existing concept with this ID in the parent hierarchy
      let existingConcept = null;
      for (let i = runner.Registers.ESP - 1; i >= 0; i--) {
        const frame = runner.DataStack[i];
        if (frame && frame[id]) {
          existingConcept = frame[id];
          break;
        }
      }
      currentContext[id] = existingConcept || {};
    }
    // Structural containers push their specific context onto the stack
    runner.DataStack.push(currentContext[id]);
    runner.Registers.ESP = runner.DataStack.length - 1;
    runner.Registers.CSP = runner.Registers.ESP;
  }

  return true;
}

async function handleState(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  const { id, value } = node.instruction.params || {};
  const currentContext = runner.DataStack[runner.Registers.ESP] as any;

  if (id && typeof id === 'string' && currentContext) {
    const val = evalLambda(runner, id, value);
    currentContext[id] = val;
  }

  return true;
}

export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  const { type } = node.instruction;
  switch (type) {
    case '👤':
      // Entities might have specific logic, but for now they behave like concepts
      return handleConcept(node, runner);
    case '🧠':
      return handleConcept(node, runner);
    case '📌':
      return handleState(node, runner);
  }
  return true;
}