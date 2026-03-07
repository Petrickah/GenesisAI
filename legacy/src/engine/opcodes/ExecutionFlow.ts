import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

interface TriggerInfo {
  id: string | number;
  triggerStart: number;
}

async function handleTrigger(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  if (!runner.Program || !runner.Program.code) {
    console.error("Runner program or program code is null/undefined during handleTrigger.");
    return false; // Cannot process trigger without a valid program
  }

  const nextInstructionAddress = node.next as number; // Take the first jump path
  const nextInstructionRaw = runner.Program.code[nextInstructionAddress];
  const isPersistent = nextInstructionRaw && runner.PersistentOpcodes.includes(nextInstructionRaw.type);

  const triggerInfo: TriggerInfo = {
    id: node.instruction.id ?? node.address,
    triggerStart: node.address, // Store the trigger's starting address
  };

  if (isPersistent) {
    // Persistent Mode: Push a new locked frame for Entities
    const newFrame: KrakoanRunner['DataStack'][number] = {};
    newFrame.__activeTriggers = [triggerInfo];
    runner.DataStack.push(newFrame);
    runner.Registers.ESP = runner.DataStack.length - 1;
    runner.Registers.BSP = runner.Registers.ESP; // Lock BSP to this new frame
    runner.Registers.CSP = runner.Registers.ESP; // CSP also points to this new frame
  } else {
    // Transient Mode: Push trigger info onto the current context's activeTriggers list
    const currentContext = runner.DataStack[runner.Registers.ESP];
    if (currentContext) {
      if (!currentContext.__activeTriggers) {
        currentContext.__activeTriggers = [];
      }
      const hasActiveTrigger = currentContext.__activeTriggers.find((trigger: TriggerInfo) => trigger.id === triggerInfo.id);
      if (!hasActiveTrigger) {
        currentContext.__activeTriggers.push(triggerInfo);
      }
    } else {
      console.error(`Transient trigger handling failed: DataStack at ESP ${runner.Registers.ESP} is undefined.`);
      return false; // Critical error, cannot proceed
    }
  }

  return true;
}

async function handleAnchor(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  return true;
}

async function handleJump(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  const { goto, maxCycles, cycles } = node.instruction.params || {};
  const tags = node.instruction.tags || [];

  if (goto === undefined || goto === null) {
    console.error(`Jump handling failed: 'goto' parameter is undefined.`);
    return false; // Critical error, cannot proceed
  }

  const limit = (maxCycles ?? cycles) as number;

  if (limit === undefined || limit === null) {
    console.error(`Jump handling failed: 'cycles' or 'maxCycles' parameter is undefined.`);
    return false; // Critical error, cannot proceed
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    console.error(`Jump handling failed: 'tags' parameter is not an array or is empty.`);
    return false; // Critical error, cannot proceed
  }

  const { address: targetAddress } = (tags.find((tag) => tag.target === goto) ?? { address: -1 }) as { address: number };

  if (targetAddress !== -1) {
    const currentContext = runner.DataStack[runner.Registers.ESP];
    if (currentContext) {
      if (!currentContext.__jumpCounters) {
        currentContext.__jumpCounters = {};
      }

      const jumpId = node.address;
      const currentCounter = currentContext.__jumpCounters[jumpId] ?? 0;

      if (currentCounter < limit) {
        currentContext.__jumpCounters[jumpId] = currentCounter + 1;
        runner.Registers.IP = targetAddress;
      }

      return true;
    }
  }

  return true;
}

async function handleLink(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  const { mode } = node.instruction.params || {};

  if (mode === 'Inheritance') {
    const tags = node.instruction.tags || [];
    const reference = tags[0]; // Assuming first tag is the target

    if (reference && reference.address !== undefined && reference.address !== -1) {
      // 1. Push a temporary "staging" context for the inherited concept to populate
      runner.DataStack.push({});
      runner.Registers.ESP = runner.DataStack.length - 1;
      runner.Registers.CSP = runner.Registers.ESP;

      // 2. Save return address (the node after the link)
      runner.ReturnStack.push(node.next as number);

      // 3. Jump to the target reference!
      runner.Registers.IP = reference.address;
      return true;
    }
  }

  return true;
}

async function handleSentinel(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  const params = node.instruction.params || {};

  // Flow control for Triggers
  if (params.bodyAddr !== undefined) {
    const currentContext = runner.DataStack[runner.Registers.BSP];
    if (currentContext && Array.isArray(currentContext.__activeTriggers) && currentContext.__activeTriggers.length > 0) {
      // Logic for Triggers is now purely linear finishing
      // We pop the trigger and let the IP advance (or not, if it's the last trigger)
      currentContext.__activeTriggers.pop();
      return true;
    }
  }

  // Merging and returning logic for structural containers and inheritance
  if (params.nest) {
    if (runner.ReturnStack.length > 0) {
      // Return from Inheritance Jump
      const returnAddress = runner.ReturnStack.pop();
      const inheritedData = runner.DataStack.pop();

      runner.Registers.ESP = runner.DataStack.length - 1;
      runner.Registers.CSP = runner.Registers.ESP;

      if (inheritedData) {
        const targetContext = runner.DataStack[runner.Registers.ESP];
        if (targetContext) {
          // Merge the populated data back into the parent
          Object.assign(targetContext, inheritedData);
        }
      }

      if (returnAddress !== undefined) {
        runner.Registers.IP = returnAddress;
      }
      return true;
    } else {
      // Normal context pop for nested containers (like Concepts)
      runner.DataStack.pop();
      runner.Registers.ESP = runner.DataStack.length - 1;
      runner.Registers.CSP = runner.Registers.ESP;
    }
  }

  return true;
}

export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  const { type } = node.instruction;
  switch (type) {
    case '➔':
      return handleTrigger(node, runner);
    case '⚓':
      return handleAnchor(node, runner);
    case '🔃':
      return handleJump(node, runner);
    case '🔗':
      return handleLink(node, runner);
    case '🏁':
      return handleSentinel(node, runner);
  }

  return false;
};
