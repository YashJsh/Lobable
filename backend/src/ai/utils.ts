import type { Message, ToolCall } from "./harness/harness.types";
import fs from "fs/promises";

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


export { userMessage, assistantMessage, returnedAssistantMessage };
