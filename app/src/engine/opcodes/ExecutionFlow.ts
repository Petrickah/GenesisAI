import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

async function handleTrigger(node: KrakoanInfo, runner: KrakoanRunner): Promise<boolean> {
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
