import { Sandbox } from "e2b";

export async function getSandbox(existingSandboxId?: string) {
  if (existingSandboxId) {
    try {
      console.log(`[E2B] Connecting to existing sandbox session: ${existingSandboxId}`);
      const sandboxInstance = await Sandbox.connect(existingSandboxId);
      return sandboxInstance;
    } catch (error) {
      console.error(`[E2B] Failed to connect to sandbox ${existingSandboxId}, spinning up a new container instead.`, error);
    }
  }

  console.log("[E2B] Creating a new sandbox session...");
  const newSandbox = await Sandbox.create("next-app", {
    timeoutMs: 50000,
    lifecycle: {
      onTimeout: "pause",
      autoResume: true,
    },
  });
  return newSandbox;
}