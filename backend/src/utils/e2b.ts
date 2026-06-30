import { Sandbox } from "e2b";

let sandbox: Sandbox | null = null;
let sandboxId: string | null = null;

export async function getSandbox() {
  if (sandbox) {
    return sandbox;
  }
  if (sandboxId) {
    sandbox = await Sandbox.connect(sandboxId);
   
  } else {
    sandbox = await Sandbox.create("react-app", {
      lifecycle : {
        onTimeout : "pause"
      }
    });
    sandboxId = sandbox.sandboxId;
   
  }

  return sandbox;
}