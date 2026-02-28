/**
 * Trigger Opcode Handler (➔)
 * 
 * Manages the creation of stack frames, looping logic (cycles),
 * and the merging of context upon frame completion.
 * 
 * Flow:
 * 1. Entry: Create a new stack frame on the DataStack.
 * 2. Update Registers: Set BSP to the new frame and move IP to the body.
 * 3. Execution: Cycle through the body instructions.
 * 4. Exit/Loop: Check cycles, pop/merge frames, and return to original IP.
 */

import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

/**
 * Main execution handler for the Trigger token (➔).
 * 
 * @param node - The current execution frame info.
 * @param runner - The current VM instance.
 * @returns True if the trigger cycle was processed successfully.
 */
export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  const { id, next } = node.instruction;
  const triggerName = `__trigger@${node.address}:${id ?? 'anon'}`;
  const currContext = runner.DataStack[runner.Registers.BSP];

  // If we haven't entered this trigger yet, or we're at a different frame
  if (!currContext || currContext.__trigger != triggerName) {
    const newStackFrame = {
      [`__trigger`]: triggerName,
      [triggerName]: {
        '__cycleCount': 0,
        '__cycleMaxim': 1, // Default to 1 execution cycle
        '__curAddress': next[0],
        '__retAddress': next[1],
      },
      '__retAddress': node.address,
      '__isExecuting': false,
      '__BSP': runner.Registers.BSP,
    };

    // Push new context and update registers
    runner.DataStack.push(newStackFrame);
    runner.Registers.ESP = runner.DataStack.length - 1;
    runner.Registers.BSP = runner.Registers.ESP;
    runner.Registers.IP = next[0];
    return true;
  }

  // Handle existing frame (Looping or Exiting)
  const parent = runner.DataStack[runner.Registers.BSP];
  if (parent && parent.__trigger === triggerName) {
    const { __cycleCount, __cycleMaxim } = parent[triggerName];
    
    // Check if we need to run another cycle (for future loop support)
    if (__cycleCount + 1 < __cycleMaxim) {
      parent[triggerName].__cycleCount++;
      runner.Registers.IP = parent[triggerName].__curAddress;
      parent.__isExecuting = false; // Reset status for the next cycle
      return true;
    }

    // Exit phase: Clean up the stack and merge child contexts back to the parent
    while (runner.Registers.ESP > runner.Registers.BSP) {
      const child = runner.DataStack.pop();

      if (child) {
        // Clean system internal keys before merging
        delete child[child.__trigger];
        delete child.__trigger;
        Object.assign(parent, child);
      }

      runner.Registers.ESP = runner.DataStack.length - 1;
    }

    // Rebase registers to previous scope
    runner.Registers.BSP = parent.__BSP;
    runner.Registers.IP  = parent[parent.__trigger].__retAddress;
    return true;
  }

  return false;
}
