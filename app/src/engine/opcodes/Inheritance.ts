/**
 * Inheritance and Return Opcode Handler
 * 
 * Manages the 🔗 token for relationship linking and the control flow
 * logic for returning from nested scopes.
 */

import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

/**
 * Handles the return logic back to the parent context.
 * Sets the IP to the return address stored in the parent frame.
 * 
 * @param runner - The current VM instance.
 * @returns True if return was successful.
 */
async function handleReturn(runner: KrakoanRunner): Promise<boolean> {
  const parent = runner.DataStack[runner.Registers.BSP];
  if (parent && parent.__retAddress !== runner.Registers.IP) {
    runner.Registers.IP  = parent.__retAddress;
    return true;
  }

  return false;
}

/**
 * Handles the inheritance logic (🔗).
 * Currently validates that the inheritance is called within a valid Trigger scope.
 * 
 * @param node - The current execution frame.
 * @param runner - The current VM instance.
 * @returns True if inheritance setup is valid.
 */
async function handleInheritance(node: KrakoanInfo, runner: KrakoanRunner) {
  const currentBSP = runner.Registers.BSP;
  const parentContext = runner.DataStack[currentBSP];

  const isValidTrigger = node 
    && parentContext
    && parentContext.__trigger 
    && parentContext.__retAddress === (node.address - 1);

  if (!isValidTrigger) {
    console.error("🚨 Rogue Inheritance detected! No active Trigger parent at IP - 1.");
    return false;
  }

  runner.Registers.IP = parentContext.__retAddress;
  return true;
}

/**
 * Dispatches to the specific mode handler based on the instruction parameters.
 */
export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  const mode = node.instruction.params.mode as string;

  switch (mode) {
    case "Inheritance":
      return handleInheritance(node, runner);
    case "Return":
      return handleReturn(runner);
    default:
      return false;
  }
}
