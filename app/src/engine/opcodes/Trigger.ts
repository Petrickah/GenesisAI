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
  const { id, next, type, tags } = node.instruction;
  const triggerName = `__trigger@${node.address}:${id ?? 'anon'}`;
  const currContext = runner.DataStack[runner.Registers.BSP];

  // If we haven't entered this trigger yet, or we're at a different frame
  if (!currContext || currContext.__trigger != triggerName) {
    const isBumerang = tags && tags.length > 0;
    
    const newStackFrame = {
      [`__trigger`]: triggerName,
      [triggerName]: {
        '__cycleCount': 0,
        '__cycleMaxim': isBumerang ? tags.length : 1, 
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

    // --- RECURSIVE DATA PEEKING (ABSORPTION) ---
    // If this is a structural trigger (Inheritance/Trigger), peek into its body
    // and pull data from context nodes (🧠, 👤, 🔓, etc.)
    const absorbBodyData = async (instruction: any, frame: any) => {
      // Decode if it's a number
      const decoded = await runner.decode(instruction);
      if (decoded.body && decoded.body.length > 0) {
        for (const childAddr of decoded.body) {
          const childRaw = runner.Program!.code[childAddr];
          if (!childRaw) continue;
          const child = await runner.decode(childRaw);
          
          // If it's a structural node, absorb its params
          if (["🧠", "👤", "🔓", "📌", "📂", "📑", "🧬", "🧩", "🩺", "💉", "🛡️", "🚀", "🎭", "📦"].includes(child.type)) {
            if (child.id) {
              frame[child.id] = { ...child.params, __type: child.type };
            }
            // Merge params directly into frame
            Object.assign(frame, child.params);
            
            // For 📌 and 📂, also use their ID as a key for their primary value
            if ((child.type === "📌" || child.type === "📂") && child.id) {
              const val = child.params.value || child.params.content || child.params;
              frame[child.id] = val;
            }
          }
          // Recursively peek into children that aren't triggers
          if (child.type !== "➔") {
            await absorbBodyData(child, frame);
          }
        }
      }
    };

    // If we're entering a trigger, peek ahead to absorb structural data
    // This allows lambdas inside the trigger to see the data immediately.
    await absorbBodyData(node.instruction, newStackFrame);

    // --- TAG PEEKING (ABSORPTION) ---
    // Also peek into tags if it's an inheritance trigger
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (tag.address !== undefined && tag.address !== -1) {
          const tagInstruction = runner.Program!.code[tag.address];
          if (tagInstruction) await absorbBodyData(tagInstruction, newStackFrame);
        }
      }
    }

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
    const retAddr = parent[triggerName].__retAddress;
    const grandParentIndex = parent.__BSP;

    // 1. Merge all children into the current trigger frame
    while (runner.Registers.ESP > runner.Registers.BSP) {
      const child = runner.DataStack.pop();

      if (child) {
        // Clean system internal keys before merging
        if (child.__trigger) delete child[child.__trigger];
        delete child.__trigger;
        delete child.__retAddress;
        delete child.__isExecuting;
        delete child.__BSP;
        Object.assign(parent, child);
      }

      runner.Registers.ESP = runner.DataStack.length - 1;
    }

    // 2. Merge current trigger frame into its parent (grandParent)
    const self = runner.DataStack.pop();
    if (self && grandParentIndex !== -1) {
      const grandParent = runner.DataStack[grandParentIndex];
      if (grandParent) {
        if (self.__trigger) delete self[self.__trigger];
        delete self.__trigger;
        delete self.__retAddress;
        delete self.__isExecuting;
        delete self.__BSP;
        Object.assign(grandParent, self);
      }
    }

    // 3. Rebase registers to previous scope
    runner.Registers.BSP = grandParentIndex;
    runner.Registers.ESP = runner.DataStack.length - 1;
    runner.Registers.IP  = retAddr;
    return true;
  }

  return false;
}
