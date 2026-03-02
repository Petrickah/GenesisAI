import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

async function handleTrigger(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  console.log(`Executing Trigger (➔) at address ${node.address}`);
  // In a real scenario, this would likely push a new context frame
  runner.Registers["Status"] = 'RUNNING'; // Ensure it's running
  return true;
}

async function handleAnchor(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  console.log(`Executing Anchor (⚓) at address ${node.address}`);
  // In a real scenario, this might mark a persistent state
  runner.Registers["lastAnchor"] = node.address;
  return true;
}

async function handleJump(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  console.log(`Executing Jump (🔃) at address ${node.address}`);
  // For now, let's just simulate a jump by changing the IP
  // This is a placeholder; actual jump logic would need a target address from node.instruction
  if (node.instruction.target !== undefined) {
    runner.Registers["IP"] = node.instruction.target;
    return false; // Return false to prevent auto-incrementing IP
  }
  return true;
}

async function handleLink(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  console.log(`Executing Link (🔗) at address ${node.address}`);
  // Placeholder for linking logic, e.g., pushing to DataStack or modifying Symbols
  runner.DataStack[runner.Registers.ESP as number]["lastLink"] = node.address;
  return true;
}

async function handleSentinel(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
  console.log(`Executing Sentinel (🏁) at address ${node.address}`);
  // In a real scenario, this might mark the end of a block or a halt condition
  runner.Registers["Status"] = 'HALTED';
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
