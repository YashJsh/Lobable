import Groq from "groq-sdk";
import type {
  Message,
  ModelProvider,
  ReturnedResponse,
  ToolDefiniton,
} from "../harness/harness.types";

class GroqProvider implements ModelProvider {
  private client;
  private maxRetries;
  public model;

  constructor(maxRetries: number, model: string) {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    this.maxRetries = maxRetries;
    this.model = model;
  }

  name() {
    return "GROQ MODEL";
  }

  async chat(message: Message[], tools: ToolDefiniton[]) {
    const response = await this.chat_impl(message, tools);
    if (!response) {
      throw new Error("NO RESPONSE FROM GROQ");
    }
    if (response.choices[0]) {
      const returnedRespnose: ReturnedResponse = {
        content: response?.choices[0].message.content,
        finishReason: response?.choices[0]?.finish_reason,
        role: "assistant",
        tool_call: response?.choices[0].message.tool_calls,
      }
      return returnedRespnose;
    }
    return;
  }

  async chat_impl(message: Message[], tools : ToolDefiniton[]) {
    for (let i = 1; i <= this.maxRetries; i++) {
      try {
        return await this.chat_once(message, tools);
      } catch (error) {
        console.log('OPEN AI ERROR :', error);
        if (error instanceof Error) console.error(`[OpenAI]  └─ ${error.message}`);
      }
    }
  }

  async chat_once(message: Message[], tools: ToolDefiniton[]) {
    return this.client.chat.completions.create({
      messages: message as any,
      model: this.model,
      tools,
    });
  }
}

export { GroqProvider };