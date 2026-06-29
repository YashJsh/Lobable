import OpenAI from "openai";
import type {
  Message,
  ModelProvider,
  ReturnedResponse,
  ToolCall,
  ToolDefiniton,
} from "../harness/harness.types";

class OpenAIProvider implements ModelProvider {
  private client: OpenAI;
  private maxRetries: number;
  public model: string;

  constructor(maxRetries: number, model: string) {
    this.client = new OpenAI();
    this.maxRetries = maxRetries;
    this.model = model;
  }

  public name() {
    return this.model;
  }

  public async chat(
    message: Message[],
    tools: ToolDefiniton[],
  ): Promise<ReturnedResponse | void> {
    const response = await this.chat_implementation(message, tools);
    if (!response) {
      throw new Error("No response from openAI");
    }
    if (response.choices[0]) {
      return {
        role: "assistant",
        content: response.choices[0].message.content,
        finishReason: response.choices[0].finish_reason,
        tool_call: response.choices[0].message.tool_calls as ToolCall[],
      };
    }
    return;
  }

  private async chat_implementation(
    message: Message[],
    tools: ToolDefiniton[],
  ) {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await this.chat_once(message, tools);
      } catch (error) {
        console.log('OPEN AI ERROR :', error);
        if (error instanceof Error) console.error(`[OpenAI]  └─ ${error.message}`);
      }
    }
  }

  private async chat_once(message: Message[], tools: ToolDefiniton[]) {
    const response = await this.client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: message as any,
      tools: tools as any,
    });
    return response;
  }
}

export default OpenAIProvider;
