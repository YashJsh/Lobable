import type { Message, ModelProvider, ToolDefiniton } from "./harness.types";
import { toolsDefinition } from "../tools/tools";
import { userMessage } from "../utils";

class Harness{
  private provider: ModelProvider;
  private transcript: Message[];
  public toolDefinition: ToolDefiniton[];
  
  constructor(provider: ModelProvider) {
    this.provider = provider
    this.toolDefinition = toolsDefinition
    this.transcript = []
  };

  async sendMessage(input: string) {
    this.transcript.push(userMessage(input));
    while (true) {
      const result = await this.provider.chat(this.transcript, this.toolDefinition);
      this.transcript.push(result);
      if (result.finishReason == "stop") {
        return "Answer"
      }
      if (result.finishReason == "toolCall") {
        //ToolCall flow.
      }
    }
  }
  
}
