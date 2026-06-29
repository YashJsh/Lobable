import { getSandbox } from "../../utils/e2b";
import type { ToolImplementation } from "../harness/harness.types";
import { getAbsolutePath } from "../utils";

const sandbox = await getSandbox();

const bashToolImplementation = async (args: unknown) => {
  const { command } = args as {
    command: string;
  };
  console.log(`[subAgent Calling] :  bash_tool`);
  console.log(`COMMAND IS : `, command);
  try {
    const response = await sandbox.commands.run(command);
    return JSON.stringify(response);
  } catch (error: any) {
    console.log(`[subAgent] bash_tool | error: ${error?.message ?? "unknown error"}`);
    return `error in bash tool: ${error?.message ?? "unknown error"}`;
  }
};

const writeCommand = async (
  args: unknown,
  options?: {
    emit?: (event: any) => void;
     workspaceRoot?: string;
  },
) => {
  const { path, content } = args as {
    path: string;
    content: string;
  };
  const absolutePath = getAbsolutePath(options?.workspaceRoot!, path);
  console.log(`[subAgent Calling] : write_file `);
  console.log(`[path is : `, path);
  try {
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
  },
) => {
  console.log(`[subAgent Calling] :  read_file `);
  const { path } = args as { path: string };
  const absolutePath = getAbsolutePath(options?. workspaceRoot!, path);
  console.log(`ABSOLUTE PATH IS : ${absolutePath}`);
  try {
    const result = await sandbox.files.read(absolutePath);
    return result;
  } catch (error: any) {
    console.log(`[subAgent] read_file  | error: ${error?.message ?? "unknown error"}`);
    return `error: ${error?.message ?? "unknown error"}`;
  }
};

const editCommand = async (
  args: unknown,
  options?: {
    emit?: (event: any) => void;
     workspaceRoot?: string;
  },
) => {
  
  const { path, old_str, new_str } = args as {
    path: string;
    old_str: string;
    new_str: string;
  };
  
  const absolutePath = getAbsolutePath(options?. workspaceRoot!, path);
  let read = await sandbox.files.read(absolutePath);
  let old_str_new = old_str.trim();
  let m = (read.match(new RegExp(old_str_new, "g")) || []).length;
  
  console.log(`[subAgent] editTool`);
  console.log(`ABSOLUTE PATH IS : `, absolutePath);
  
  if (m == 1) {
    read = read.replace(old_str_new, new_str);
    await sandbox.files.write(absolutePath, read);
    return "Replaced data successfully";
  } else if (m == 0) {
    return "No data found";
  } else {
    return "Argument is present more than once";
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
  {
    name: "editTool",
    implementation: editCommand,
  },
];

export { subAgentTools as subAgentToolsImplementation };
