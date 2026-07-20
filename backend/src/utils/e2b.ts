import { Sandbox } from "e2b";

export async function createSandbox(): Promise<Sandbox> {
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

export async function getSandbox(existingSandboxId?: string): Promise<Sandbox> {
  if (!existingSandboxId) {
    throw new Error("sandboxId is required to connect to an existing sandbox session");
  }
  console.log(`[E2B] Connecting to existing sandbox session: ${existingSandboxId}`);
  const sandboxInstance = await Sandbox.connect(existingSandboxId);
  return sandboxInstance;
}