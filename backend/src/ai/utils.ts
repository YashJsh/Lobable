import type { Message, ToolCall } from "./harness/harness.types";
import path from "path";

const userMessage = (input: string): Message => {
  return {
    role: "user",
    content: input,
  };
};

const assistantMessage = (input: string): Message => {
  return {
    role: "assistant",
    content: input,
  };
};

const returnedAssistantMessage = (
  content: string | null,
  tool_calls?: ToolCall[] | undefined,
): Message => {
  return {
    role: "assistant",
    content,
    tool_calls,
  };
};


const getAbsolutePath = (workspaceRoot: string, paths: string)=> {
  if (paths.startsWith("/")) {
    return paths
  }
  const absolutePath = path.join(workspaceRoot, paths);
  return absolutePath;
}

export { userMessage, assistantMessage, returnedAssistantMessage, getAbsolutePath };
