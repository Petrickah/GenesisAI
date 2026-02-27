import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";

/**
 * Handles speech and communication operations in Krakoan VM
 * Supports tokens: 💬 (communication), 📡 (signals)
 */
export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  const { type, params } = node.instruction;
  const currentContext = runner.DataStack[runner.Registers.BSP] || {};

  // Handle different speech types
  switch (type) {
    case "💬": // Communication token
      return handleCommunication(node, runner, currentContext, params);
    case "📡": // Signal token
      return handleSignal(node, runner, currentContext, params);
    default:
      return false;
  }
};

/**
 * Handles communication operations (💬)
 */
async function handleCommunication(
  node: KrakoanInfo,
  runner: KrakoanRunner,
  currentContext: Record<string, any>,
  params: any
): Promise<boolean> {
  try {
    // Extract communication parameters
    const { target, message, channel } = params || {};

    // Create communication record in current context
    currentContext.__communication = currentContext.__communication || [];
    currentContext.__communication.push({
      timestamp: Date.now(),
      target,
      message,
      channel,
      source: runner.Registers.BSP,
      address: node.address
    });

    // Log communication event
    console.log(`💬 Communication from ${runner.Registers.BSP} to ${target || 'global'}:`, message);

    return true;
  } catch (error) {
    console.error(`❌ Communication Error:`, error);
    return false;
  }
}

/**
 * Handles signal operations (📡)
 */
async function handleSignal(
  node: KrakoanInfo,
  runner: KrakoanRunner,
  currentContext: Record<string, any>,
  params: any
): Promise<boolean> {
  try {
    // Extract signal parameters
    const { name, payload, broadcast } = params || {};

    // Create signal record in current context
    currentContext.__signals = currentContext.__signals || [];
    currentContext.__signals.push({
      name,
      payload,
      timestamp: Date.now(),
      broadcast: !!broadcast,
      source: runner.Registers.BSP,
      address: node.address
    });

    // Log signal event
    console.log(`📡 Signal ${name} sent from ${runner.Registers.BSP}:`, payload);

    // If broadcast is true, push to all stack frames
    if (broadcast) {
      for (let i = 0; i < runner.DataStack.length; i++) {
        const frame = runner.DataStack[i];
        if (frame && frame !== currentContext) {
          frame.__signals = frame.__signals || [];
          frame.__signals.push({
            name,
            payload,
            timestamp: Date.now(),
            broadcast: true,
            source: runner.Registers.BSP,
            address: node.address
          });
          console.log(`📡 Broadcast signal ${name} to frame ${i}:`, payload);
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ Signal Error:`, error);
    return false;
  }
}