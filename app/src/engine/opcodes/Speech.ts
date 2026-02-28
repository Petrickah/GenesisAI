import type { KrakoanInfo } from "../../schema/krakoa.schema.js";
import type { KrakoanRunner } from "../KrakoaRunner.js";
import { evalLambda } from "../KrakoaEvaluator.js";

/**
 * Handles speech and communication operations in Krakoan VM
 * Supports tokens: 💬 (communication), 📡 (signals)
 */
export default async (node: KrakoanInfo, runner: KrakoanRunner) => {
  const { type, params, tags } = node.instruction;
  const currentContext = runner.DataStack[runner.Registers.BSP] || {};

  // Signal to the trigger that this instruction is executing
  if (currentContext && currentContext.__trigger) {
    currentContext.__isExecuting = true;
  }

  // Bumerang logic: If tags are present, jump to them first
  if (tags && tags.length > 0) {
    const parentContext = runner.DataStack[runner.Registers.BSP];
    const triggerName = parentContext?.__trigger;
    
    if (triggerName) {
      parentContext[triggerName].__cycleMaxim = tags.length;
      const currentCycle = parentContext[triggerName].__cycleCount;
      const tag = tags[currentCycle];

      if (tag && tag.address !== undefined && tag.address !== -1) {
        console.log(`🔗 ${type} Bumerang jumping to: ${tag.original} at address ${tag.address}`);
        runner.Registers.IP = tag.address;
        return true;
      }
    }
  }

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
    const target = evalLambda(runner, "SpeechTarget", params?.to || params?.target);
    const channel = evalLambda(runner, "SpeechChannel", params?.channel);
    
    // In Krakoa, message content is usually in a sub-instruction 📂 ("Message", content: λ(...))
    // But for simplicity if it's in params, we eval it.
    let message = evalLambda(runner, "SpeechMessage", params?.content || params?.message);

    // Fallback A: Check if "Message" was absorbed into current frame (from child 📂)
    if ((message === undefined || message === null) && currentContext["Message"]) {
      message = currentContext["Message"];
    }

    // Fallback B: If no message is provided in params, look for it in the context stack
    if (message === undefined || message === null) {
      const absorbedGreeting = evalLambda(runner, "AbsorbedGreeting", { 
        type: ":lambda", 
        code: "const target = ctx['Chimichanga Optimized'] || ctx['Greeting'] || ctx['content'] || ctx['Message']; return (target && typeof target === 'object') ? (target.content || target.value || target.message || target) : target;" 
      });
      if (absorbedGreeting) {
        message = absorbedGreeting;
      }
    }

    // Final fallback
    if (message === undefined || message === null || (typeof message === 'object' && Object.keys(message).length === 0)) {
      message = "No message found in context.";
    }

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
    console.log(`\n[KRAKOA-OUTPUT]: 💬 Communication to ${target || 'global'}: "${message}"\n`);

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
    const name = evalLambda(runner, "SignalName", params?.name);
    const payload = evalLambda(runner, "SignalPayload", params?.payload);
    const broadcast = evalLambda(runner, "SignalBroadcast", params?.broadcast);

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