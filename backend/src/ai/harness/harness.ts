import type { Message, ModelProvider, ToolDefiniton, ToolImplementation } from "./harness.types";
import { userMessage } from "../utils";

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
        return "Answer"
      }
      if (result.finishReason == "toolCall") {
        //ToolCall flow.
      }
    }
  }
}

export default Harness;