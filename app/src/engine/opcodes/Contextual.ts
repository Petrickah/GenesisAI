import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  return true;
}