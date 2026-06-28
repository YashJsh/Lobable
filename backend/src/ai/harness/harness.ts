import type {
  Message,
  ModelProvider,
  ToolDefiniton,
  ToolImplementation,
} from "./harness.types";
import { assistantMessage, returnedAssistantMessage, userMessage } from "../utils";

class Harness {
  private provider: ModelProvider;
  private transcript: Message[];
  private toolDefinition: ToolDefiniton[];
  private toolImplementation: ToolImplementation[];
  private onEvent?: (event : string) => void;

  constructor(
    provider: ModelProvider,
    toolDefinition: ToolDefiniton[],
    toolImplementation: ToolImplementation[],
    prompt: string,
    onEvent?: (event : string) => void
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
    this.onEvent = onEvent;
  }

  async sendMessage(input: string) {
    this.transcript.push(userMessage(input));
    while (true) {
      const result = await this.provider.chat(
        this.transcript,
        this.toolDefinition,
      );
      if (!result) {
        console.log("No response from AI");
        return;
      }
      if (this.onEvent) {
        this.onEvent(JSON.stringify(result));
      }
      console.log("[Harness Response]: ", result);
      this.transcript.push(returnedAssistantMessage(result.content, result.tool_call));
      if (result.finishReason == "stop") {
        return result.content || "";
      }
      if (result.finishReason == "tool_calls") {
        console.log(`[Harness]: Implementing Tool Calls`);
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
                { emit : this.onEvent }
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


export { Harness };
