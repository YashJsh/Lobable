import { exec } from "child_process";
import fs from "fs/promises";
import type { ToolImplementation } from "../harness/harness.types";

const bashToolImplementation = async (args: unknown) => {
  console.log("[subAgent] : [Bash command Tool]")
  const { command } = args as {
    command: string
  };
  return new Promise<string>((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve(
        JSON.stringify({
          command,
          success: !error,
          exitCode: error?.code ?? 0,
          stdout,
          stderr,
          error: error?.message ?? null,
        }),
      );
    });
  });
};

const writeCommand = async (args: unknown) => {
  console.log("[subAgent] : [Write command Tool]")
  const { path, content } = args as {
    path: string,
    content: string
  };
  try {
    await fs.writeFile(path, content);
    return "success";
  } catch (error: any) {
    return `error: ${error?.message ?? "unknown error"}`;
  }
};

const readCommand = async (args: unknown) => {
  console.log("[subAgent] : [Read command Tool]")
  const { path } = args as { path : string} 
  const result = await fs.readFile(path, "utf-8");
  return result;
};

const editCommand = async (args: unknown) => {
  console.log("[subAgent] : [Called edit Tool]")
  const { path, old_str, new_str } = args as {
    path: string,
    old_str: string,
    new_str: string
  };
  let read = await fs.readFile(path, "utf-8");
  let old_str_new = old_str.trim();
  let m = (read.match(new RegExp(old_str_new, "g"))|| []).length;
  if (m == 1) {
    read = read.replace(old_str, new_str);
    fs.writeFile(path, read);
    console.log("replaced");
    return "Replaced data successfully";
  } else if (m == 0) {
    return "No data found";
  } else {
    return "Argument is present more than once";
  }
}

const subAgentTools: ToolImplementation[] = [
  {
    name: "bash_tool",
    implementation: bashToolImplementation
  },
  {
    name: "write_file",
    implementation: writeCommand
  },
  {
    name: "read_file",
    implementation: readCommand
  },
  {
    name: "editTool",
    implementation: editCommand
  }
];

export {
  subAgentTools as subAgentToolsImplementation
}