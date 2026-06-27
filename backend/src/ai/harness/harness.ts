import type {
  Message,
  ModelProvider,
  ToolDefiniton,
  ToolImplementation,
} from "./harness.types";
import { userMessage } from "../utils";
import OpenAIProvider from "../providers/openai";
import { toolsDefinition } from "../tools/toolDefinition";
import { mainAgentTools } from "../tools/toolImplementation";
import { MAIN_AGENT_SYSTEM_PROMPT } from "../prompt/mainAgentPrompt";

class Harness {
  private provider: ModelProvider;
  private transcript: Message[];
  private toolDefinition: ToolDefiniton[];
  private toolImplementation: ToolImplementation[];

  constructor(
    provider: ModelProvider,
    toolDefinition: ToolDefiniton[],
    toolImplementation: ToolImplementation[],
    prompt: string,
  ) {
    this.provider = provider;
    this.toolDefinition = toolDefinition;
    this.transcript = [
      {
        role: "system",
        content: prompt,
      },
    ];
    this.toolImplementation = toolImplementation;
  }

  async sendMessage(input: string) {
    this.transcript.push(userMessage(input));
    while (true) {
      const result = await this.provider.chat(
        this.transcript,
        this.toolDefinition,
      );

      this.transcript.push(result);
      if (result.finishReason == "stop") {
        return result.content;
      }
      if (result.finishReason == "tool_calls") {
        const toolResults = await Promise.all(
          (result.tool_call ?? []).map(async (tool) => {
            const match = this.toolImplementation.find(
              (t) => t?.name === tool.function.name,
            );

            if (!match?.implementation) {
              return {
                role: "tool" as const,
                content: "No such tool exists",
                tool_call_id: tool.id,
              };
            }

            try {
              const toolOutput = await match.implementation(
                JSON.parse(tool.function.arguments),
              );
              return {
                role: "tool" as const,
                content: JSON.stringify(toolOutput),
                tool_call_id: tool.id,
              };
            } catch {
              return {
                role: "tool" as const,
                content: "Tool execution failed",
                tool_call_id: tool.id,
              };
            }
          }),
        );

        this.transcript.push(...toolResults);
      }
    }
  }
}

const provider = new OpenAIProvider(1, "gpt-4.1-mini");
export const harness = new Harness(
  provider,
  toolsDefinition,
  mainAgentTools,
  MAIN_AGENT_SYSTEM_PROMPT,
);
export { Harness };
