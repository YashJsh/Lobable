import {Harness} from "../harness/harness";
import type { ToolImplementation } from "../harness/harness.types";
import OpenAIProvider from "../providers/openai";
import { subAgentToolsImplementation } from "./subAgentToolImplementation";
import { subAgentToolDefinition } from "./toolDefinition";

const spwaningSubAgent = async (args: unknown) => {
  const {prompt} = args as {
    prompt : string
  }
  const provider = new OpenAIProvider(1, "gpt-4.1-mini");
  const harness = new Harness(provider, subAgentToolDefinition, subAgentToolsImplementation);
  const result = await harness.sendMessage(prompt);
  return result;
};

const mainAgentTools: ToolImplementation[] = [
  {
    name: "spawnSubAgent",
    implementation: spwaningSubAgent,
  }
];

export {
  mainAgentTools
};
