import type { Message, ModelProvider, ReturnedResponse, ToolCall, ToolDefiniton } from "../harness/harness.types";
import { GoogleGenAI, type Content, type FunctionDeclaration, type Part, type Tool } from "@google/genai";

class GeminiProvider implements ModelProvider {
  private client: GoogleGenAI;
  private maxRetries: number;
  public model: string;

  constructor(maxRetries: number, model: string) {
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
    this.maxRetries = maxRetries;
    this.model = model;
  }

  name() {
    return "GEMINI";
  }

  public async chat(
    message: Message[],
    tools: ToolDefiniton[],
  ): Promise<ReturnedResponse | void> {
    const response = await this.chat_impl(message, tools);
    if (!response) {
      throw new Error("No response from Gemini");
    }
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content) {
      return;
    }
    let textContent: string | null = null;
    const toolCalls: ToolCall[] = [];

    for (const part of candidate.content.parts || []) {
      if (part.text) {
        textContent = (textContent || "") + part.text;
      }
      else if (part.functionCall) {
        toolCalls.push({
          id: crypto.randomUUID(),
          type: "function",
          function: {
            name: part.functionCall.name || "",
            arguments: JSON.stringify(part.functionCall.args || {})
          }
        })
      }
    }

    let finishReason: ReturnedResponse["finishReason"] = "stop";
    if (toolCalls.length > 0) {
      finishReason = "tool_calls";
    } else if (candidate.finishReason === "MAX_TOKENS") {
      finishReason = "length";
    }

    return {
      role: "assistant",
      content: textContent,
      finishReason,
      tool_call: toolCalls.length > 0 ? toolCalls : undefined
    }
  }

  private async chat_impl(message: Message[], tools: ToolDefiniton[]) {
    const { contents, systemInstruction } = this.convertMessages(message);
    const gemini_tools = this.convertTools(tools);


    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await this.chat_once(contents, gemini_tools, systemInstruction);
        return response;
      } catch (error) {
        console.log('GEMINI ERROR:', error);
        if (error instanceof Error) console.error(`{error.message}`);
      }
    }

  }


  private convertMessages(message: Message[]): { contents: Content[], systemInstruction?: string } {

    let contents: Content[] = [];
    let systemInstruction: string | undefined = "THis is the instruction";

    for (let i = 0; i < message.length; i++) {

      const msg = message[i];
      if (!msg) {
        continue;
      }

      if (msg.role === "system") {
        systemInstruction = msg?.content;
        continue;
      }

      if (msg.role === "user") {
        contents.push({
          role: "user",
          parts: [{
            text: msg.content
          }]
        })
      }

      else if (msg.role === "assistant") {
        const parts: Part[] = [];

        if (msg.content) {
          parts.push({
            text: msg.content
          });
        }

        if (msg.tool_calls && msg.tool_calls.length > 0) {
          for (const tc of msg.tool_calls) {
            parts.push({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments)
              }
            });
          }
        }
        
        contents.push({
          role: "model",
          parts
        });
      }
      else if (msg.role === "tool") {
        let toolName = "unknown_tool";
        for (let j = i - 1; j >= 0; j--) {
          const prevMsg = message[j];
          if (!prevMsg) {
            continue;
          }
          if (prevMsg.role === "assistant" && prevMsg.tool_calls) {
            const tc = prevMsg.tool_calls.find(t => t.id === msg.tool_call_id);
            if (tc) {
              toolName = tc.function.name;
              break;
            }
          }
        }
        let responseObj;
        try {
          responseObj = JSON.parse(msg.content);
        } catch (e) {
          responseObj = {
            result: msg.content
          }
        }

        contents.push({
          role: "user",
          parts: [{
            functionResponse: { name: toolName, response: responseObj }
          }]
        });
      }

    }
    return { contents, systemInstruction };
  }

  private convertTools(tools: ToolDefiniton[]): Tool[] | undefined {
    if (!tools || tools.length == 0) return undefined;

    const functionDeclarations: FunctionDeclaration[] = tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters as any
    }));

    return [{
      functionDeclarations
    }]
  }

  private async chat_once(contents: Content[], tools?: Tool[], systemInstruction?: string) {
    const response = await this.client.models.generateContent({
      contents,
      model: "gemini-3.1-pro-preview",
      config: {
        tools,
        systemInstruction: systemInstruction
      }
    })
    return response;
  }
}

export { GeminiProvider }
