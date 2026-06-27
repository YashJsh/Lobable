import OpenAI from "openai";
import type { Message, ModelProvider, ToolDefiniton } from "../harness/harness.types";

class OpenAIProvider implements ModelProvider{
  public client: OpenAI;
  public maxRetries: number;
  public model: string;
  
  constructor(maxRetries: number, model: string) {
    this.client = new OpenAI();
    this.maxRetries = maxRetries;
    this.model = model;
  }
  
  name() {
    return "openai";
  }

  async chat(message: Message[], tools: ToolDefiniton[]): Promise<any> {
    this.chat_implementation(message, tools);
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

export default OpenAIProvider;