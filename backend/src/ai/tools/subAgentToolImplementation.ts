import { exec } from "child_process";
import fs from "fs/promises";
import type { ToolImplementation } from "../harness/harness.types";

const bashToolImplementation = async (args : unknown) => {
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
  const { path } = args as { path : string} 
  const result = await fs.readFile(path, "utf-8");
  return result;
};

const subAgentTools: ToolImplementation[] = [
  { name: "bashTool", implementation: bashToolImplementation },
  { name: "writeCommand", implementation: writeCommand },
  { name: "readCommand", implementation: readCommand },
];

export {
  subAgentTools as subAgentToolsImplementation
}