import Harness from "../harness/harness";
import OpenAIProvider from "../providers/openai";
import { subAgentToolsImplementation } from "./subAgentToolImplementation";
import { subAgentToolDefinition } from "./toolDefinition";

const subAgentToolImplementation = async (prompt: string) => {
  const provider = new OpenAIProvider(1, "gpt-4.1-mini");
  const harness = new Harness(provider, subAgentToolDefinition, subAgentToolsImplementation);
  const result = await harness.sendMessage(prompt);
  return result;
};

export {
  subAgentToolImplementation,
};
