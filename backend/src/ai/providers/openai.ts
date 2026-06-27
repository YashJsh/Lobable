import OpenAI from "openai";
import type { Message, ModelProvider, ReturnedResponse, ToolDefiniton } from "../harness/harness.types";

class OpenAIProvider implements ModelProvider{
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

  public async chat(message: Message[], tools: ToolDefiniton[]): Promise<any> {
    const response = await this.chat_implementation(message, tools);
    const choices = response?.choices[0];
    if (choices) {
      const finishReason = choices.finish_reason;
      const content = choices.message.content;
      const toolCalls = choices.message.tool_calls;
      return {
        role: "assistant",
        content,
        finishReason,
        tool_call : toolCalls
      } as ReturnedResponse
    }
    else {
      return null;
    }
  }

  private async chat_implementation(message : Message[], tools : ToolDefiniton[]){ 
    for (let i = 0; i < this.maxRetries; i++){
      try {
        return await this.chat_once(message, tools);
      } catch (error) {
        console.log("Error in implementing the chat, attempt : ", i + 1);
      }
    }
  }
  
  private async chat_once(message : Message[], tools : ToolDefiniton[]){
    const response = await this.client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: message as any,
      tools : tools as any
    })
    return response;
  }
}

export default OpenAIProvider