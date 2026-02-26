import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  if (!node) return false;

  const { id, next } = node.instruction;
  const triggerName = `__trigger@${node.address}:${id ?? 'anon'}`;
  const currContext = runner.DataStack[runner.Registers.BSP];
  if (!currContext || currContext.__trigger != triggerName) {
    const newStackFrame = {
      [`__trigger`]: triggerName,
      [triggerName]: {
        '__cycleCount': 0,
        '__cycleMaxim': 1,
        '__curAddress': next[0],
        '__retAddress': next[1],
      },
      '__retAddress': node.address,
      '__isExecuting': false,
      '__BSP': runner.Registers.BSP,
    };
    runner.DataStack.push(newStackFrame);
    runner.Registers.ESP = runner.DataStack.length - 1;
    runner.Registers.BSP = runner.Registers.ESP;
    runner.Registers.IP = next[0];
    return true;
  }

  const parent = runner.DataStack[runner.Registers.BSP];
  if (parent && parent.__trigger === triggerName) {
    const { __cycleCount, __cycleMaxim } = parent[triggerName];
    if (__cycleCount + 1 < __cycleMaxim) {
      parent[triggerName].__cycleCount++;
      runner.Registers.IP = parent[triggerName].__curAddress;
      return true;
    }

    while (runner.Registers.ESP > runner.Registers.BSP) {
      const child = runner.DataStack.pop();

      if (child) {
        delete child[child.__trigger];
        delete child.__trigger;
        Object.assign(parent, child);
      }

      runner.Registers.ESP = runner.DataStack.length - 1;
    }

    runner.Registers.BSP = parent.__BSP;
    runner.Registers.IP  = parent[parent.__trigger].__retAddress;
    return true;
  }

  return false;
}