import type { KrakoanInfo, KrakoanTags } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

async function handleReturn(runner: KrakoanRunner): Promise<boolean> {
  const parent = runner.DataStack[runner.Registers.BSP];
  if (parent && parent.__retAddress !== runner.Registers.IP) {
    runner.Registers.IP  = parent.__retAddress;
    return true;
  }

  return false;
}

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

export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  if (!node) return false;
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
