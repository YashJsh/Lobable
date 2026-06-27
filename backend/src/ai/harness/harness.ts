import type { Message, ModelProvider, ToolDefiniton, ToolImplementation } from "./harness.types";
import { userMessage } from "../utils";
import OpenAIProvider from "../providers/openai";
import { toolsDefinition } from "../tools/toolDefinition";
import { mainAgentTools } from "../tools/toolImplementation";

class Harness{
  private provider: ModelProvider;
  private transcript: Message[];
  private toolDefinition: ToolDefiniton[];
  private toolImplementation: ToolImplementation[];
  
  constructor(provider: ModelProvider, toolDefinition : ToolDefiniton[], toolImplementation: ToolImplementation[]) {
    this.provider = provider
    this.toolDefinition = toolDefinition
    this.transcript = []
    this.toolImplementation = toolImplementation
  };

  async sendMessage(input: string) {
    this.transcript.push(userMessage(input));
    while (true) {
      const result = await this.provider.chat(this.transcript, this.toolDefinition);

      this.transcript.push(result);
      if (result.finishReason == "stop") {
        return result.content;
      }
      if (result.finishReason == "tool_calls") {
        for (const tools of result.tool_call!) {
          const toolToCall = tools.function.name;
          for (let i = 0; i < this.toolImplementation.length; i++){
            if (this.toolImplementation[i]?.name === toolToCall) {
              const args = JSON.parse(tools.function.arguments);
              const func = this.toolImplementation[i]?.implementation;
              if (func) {
                const result = await func(args);
                this.transcript.push({
                  role: "tool",
                  content: JSON.stringify(result),
                  tool_call_id: tools.id
                });
              }
            }
          }
        }
      }
    }
  }
}

const provider = new OpenAIProvider(1, "gpt-4.1-mini");
export const harness = new Harness(provider, toolsDefinition, mainAgentTools);
export { Harness };
