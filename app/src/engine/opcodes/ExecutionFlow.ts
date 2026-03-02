import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

async function handleTrigger(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  if (!runner.Program || !runner.Program.code) {
    console.error("Runner program or program code is null/undefined during handleTrigger.");
    return false; // Cannot process trigger without a valid program
  }

  const nextInstructionAddress = node.next;
  const nextInstructionRaw = runner.Program.code[nextInstructionAddress];
  const nextInstruction = runner.decode(nextInstructionRaw);

  const isPersistent = nextInstruction && nextInstruction.type === '👤';

  const triggerInfo = {
    id: node.instruction.id ?? node.address,
    minCycles: node.instruction.params['__minCycles'] ?? 0,
    maxCycles: node.instruction.params['__maxCycles'] ?? 1,
    minCounter: 0, // Initialize counter for loop management
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
      currentContext.__activeTriggers.push(triggerInfo);
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
  return true;
}

async function handleLink(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  return true;
}

async function handleSentinel(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  const currentContext = runner.DataStack[runner.Registers.BSP];
  if (!currentContext || !Array.isArray(currentContext.__activeTriggers) || currentContext.__activeTriggers.length === 0) {
    console.warn("Sentinel encountered without an active trigger context. ", runner.DataStack);
    return false; // Sentinel without an active trigger
  }

  const activeTriggerIndex = currentContext.__activeTriggers.length - 1;
  const activeTrigger = currentContext.__activeTriggers[activeTriggerIndex];

  // Increment the counter for the active trigger
  activeTrigger.minCounter++;
  
  if (activeTrigger.minCounter < activeTrigger.maxCycles) {
    // Loop continues: Jump back to the trigger's start address
    runner.Registers.IP = activeTrigger.triggerStart;
    console.log(`Jumping back to ${JSON.stringify(activeTrigger)}`);
    return true; // Indicate that IP was manually changed
  } else {
    // Loop completed: Pop the active trigger and continue execution past the sentinel
    currentContext.__activeTriggers.pop();
    return true; // Let the runner advance IP normally
  }
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
