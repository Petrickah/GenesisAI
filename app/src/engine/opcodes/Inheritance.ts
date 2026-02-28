/**
 * Inheritance and Return Opcode Handler
 * 
 * Manages the 🔗 token for relationship linking and the control flow
 * logic for returning from nested scopes.
 */

import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";
import { evalLambda } from "../KrakoaEvaluator.js";

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
  const triggerName = parentContext?.__trigger;

  // Inheritance must be called from a branch triggered by a parent instruction.
  // The address check ensures we are inside the execution branch of the parent trigger.
  const isValidTrigger = node 
    && parentContext
    && triggerName;

  if (!isValidTrigger) {
    console.error("🚨 Rogue Inheritance detected! No active Trigger parent.");
    return false;
  }

  const tags = node.instruction.tags || [];
  if (tags.length === 0) {
    // If no tags, move to next instruction or return to parent address
    return true;
  }

  // Set maximum cycles for the parent trigger based on the number of inheritance tags
  parentContext[triggerName].__cycleMaxim = tags.length;

  // Get current cycle count from parent trigger
  const currentCycle = parentContext[triggerName].__cycleCount;
  const tag = tags[currentCycle];

  if (tag && tag.address !== undefined && tag.address !== -1) {
    console.log(`🔗 ${node.instruction.type} jumping to tag: ${tag.original} at address ${tag.address} (Cycle ${currentCycle + 1}/${tags.length})`);
    
    // --- DATA ABSORPTION DURING JUMP ---
    // Pull structural data from the jump target into the current frame.
    // This handles cases where data is needed before the return merge.
    const absorbFromTarget = async (addr: number) => {
      const inst = runner.Program!.code[addr];
      if (!inst) return;
      const decoded = await runner.decode(inst);
      
      if (["🧠", "👤", "🔓", "📌", "📂", "📑", "🧬", "🧩", "🩺", "💉", "🛡️", "🚀", "🎭", "📦"].includes(decoded.type)) {
        // Eagerly evaluate params during absorption
        const evaluatedParams: Record<string, any> = {};
        for (const key in decoded.params) {
          evaluatedParams[key] = evalLambda(runner, `${decoded.id || 'anon'}.${key}`, decoded.params[key]);
        }

        if (decoded.id) {
          parentContext[decoded.id] = { ...evaluatedParams, __type: decoded.type };
        }
        Object.assign(parentContext, evaluatedParams);
        if ((decoded.type === "📌" || decoded.type === "📂") && decoded.id) {
          const val = evaluatedParams.value || evaluatedParams.content || evaluatedParams;
          parentContext[decoded.id] = val;
        }
      }

      if (decoded.body) {
        for (const childAddr of decoded.body) await absorbFromTarget(childAddr);
      }
    };

    await absorbFromTarget(tag.address);
    
    // Jump to the tag's address
    runner.Registers.IP = tag.address;
    
    // Signal to the trigger that this instruction is executing (preventing early exit)
    parentContext.__isExecuting = true;
    return true;
  }

  // If tag is invalid or has no address, skip it
  console.warn(`⚠️ ${node.instruction.type}: Tag ${tag?.original} at index ${currentCycle} has no address or is invalid.`);
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
