import { getSandbox } from "../../utils/e2b";
import type { ToolImplementation } from "../harness/harness.types";
import { getAbsolutePath } from "../utils";

const bashToolImplementation = async (
  args: unknown,
  options?: {
    emit?: (event: any) => void;
    workspaceRoot?: string;
    sandboxId?: string;
  }
) => {
  const { command } = args as {
    command: string;
  };
  
  console.log(`[subAgent Calling] :  bash_tool`);
  console.log(`COMMAND IS : `, command);
  console.log("SANDBOX ID IS : ", options?.sandboxId);
  try {
    const sandbox = await getSandbox(options?.sandboxId);
    const response = await sandbox.commands.run(command);
    return JSON.stringify(response);
  } catch (error: any) {
    console.log(`[subAgent] bash_tool | error`);
    console.dir(error, { depth: null });
    return JSON.stringify(error);
  }
};

const writeCommand = async (
  args: unknown,
  options?: {
    emit?: (event: any) => void;
    workspaceRoot?: string;
    sandboxId?: string;
  },
) => {
  const { path, content } = args as {
    path: string;
    content: string;
  };
  const absolutePath = getAbsolutePath(options?.workspaceRoot!, path);
  console.log(`[subAgent Calling] : write_file `);
  console.log(`[path is : `, path);
  console.log("SANDBOX ID IS : ", options?.sandboxId);
  try {
    const sandbox = await getSandbox(options?.sandboxId);
    const response = await sandbox.files.write(absolutePath, content);
    const readFile = await sandbox.files.read(absolutePath);
    return JSON.stringify({
      content: readFile,
      name: response.name,
      path : response.path
    });
  } catch (error: any) {
    console.log(`[subAgent] write_file | error: ${error?.message ?? "unknown error"}`);
    return `error: ${error?.message ?? "unknown error"}`;
  }
};

export const readCommand = async (
  args: unknown,
  options?: {
    emit?: (event: any) => void;
    workspaceRoot?: string;
    sandboxId?: string;
  },
) => {
  console.log(`[subAgent Calling] :  read_file `);
  const { path } = args as { path: string };
  const absolutePath = getAbsolutePath(options?.workspaceRoot!, path);
  console.log(`ABSOLUTE PATH IS : ${absolutePath}`);
  console.log("SANDBOX ID IS : ", options?.sandboxId);
  try {
    const sandbox = await getSandbox(options?.sandboxId);
    const result = await sandbox.files.read(absolutePath);
    return result;
  } catch (error: any) {
    console.log(`[subAgent] read_file  | error: ${error?.message ?? "unknown error"}`);
    return `error: ${error?.message ?? "unknown error"}`;
  }
};

const subAgentTools: ToolImplementation[] = [
  {
    name: "bash_tool",
    implementation: bashToolImplementation,
  },
  {
    name: "write_file",
    implementation: writeCommand,
  },
  {
    name: "read_file",
    implementation: readCommand,
  },
];

export { subAgentTools as subAgentToolsImplementation };
