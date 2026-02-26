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

export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  if (!node) return false;
  const mode = node.instruction.params.mode as string;

  switch (mode) {
    case "Inheritance":
      return true;
    case "Return":
      return handleReturn(runner);
    default:
      return false;
  }
}