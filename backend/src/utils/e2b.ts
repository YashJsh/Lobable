import { Sandbox } from "e2b";

let sandbox: Sandbox | null = null;
let sandboxId: string | null = null;

export async function getSandbox() {
  if (sandbox) {
    return sandbox;
  }
  if (sandboxId) {
    sandbox = await Sandbox.connect(sandboxId);
    console.log("++++++SANDBOX___URL+++++++", sandbox.getHost(3000));
  } else {
    sandbox = await Sandbox.create("react-app");
    sandboxId = sandbox.sandboxId;
    console.log("++++++SANDBOX___URL+++++++", sandbox.getHost(3000));
  }

  return sandbox;
}