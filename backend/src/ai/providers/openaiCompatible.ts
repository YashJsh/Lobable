import OpenAI from "openai";
import type {
  Message,
  ModelProvider,
  ReturnedResponse,
  ToolCall,
  ToolDefiniton,
} from "../harness/harness.types";

interface OpenAICompatibleOptions {
  apiKey: string;
  baseURL?: string;
  extraParams?: Record<string, unknown>;
}

class OpenAICompatibleProvider implements ModelProvider {
  private client: OpenAI;
  private maxRetries: number;
  private extraParams: Record<string, unknown>;
  public model: string;

  constructor(
    maxRetries: number,
    model: string,
    options: OpenAICompatibleOptions,
  ) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
    });
    this.maxRetries = maxRetries;
    this.model = model;
    this.extraParams = options.extraParams ?? {};
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
      throw new Error(`No response from provider (${this.model})`);
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
        console.log(`[${this.model}] PROVIDER ERROR :`, error);
        if (error instanceof Error) {
          console.error(`[${this.model}]  └─ ${error.message}`);
        }
      }
    }
  }

  private async chat_once(message: Message[], tools: ToolDefiniton[]) {
    const params = {
      model: this.model,
      messages: message,
      tools,
      ...this.extraParams,
    };
    const response = await this.client.chat.completions.create(params as any);
    return response;
  }
}

export { OpenAICompatibleProvider };
export type { OpenAICompatibleOptions };
