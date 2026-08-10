import type {
  Message,
  ModelProvider,
  ToolDefiniton,
  ToolImplementation,
} from "./harness.types";
import { returnedAssistantMessage, userMessage } from "../utils";
import { saveData } from "../../utils/conversation";
import OpenAI from "openai";

class Harness {
  private provider: ModelProvider;
  private transcript: Message[];
  private toolDefinition: ToolDefiniton[];
  private toolImplementation: ToolImplementation[];
  private onEvent?: (event: string) => void;
  private sandboxId?: string;

  constructor(
    provider: ModelProvider,
    toolDefinition: ToolDefiniton[],
    toolImplementation: ToolImplementation[],
    prompt: string,
    onEvent?: (event: string) => void,
    sandboxId?: string
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
    this.sandboxId = sandboxId;
  }

  public async sendMessage(input: string) {
    saveData(this.transcript);
    saveData(userMessage(input));
    this.transcript.push(userMessage(input));

    const startTime = Date.now();
    let turn = 0;

    while (true) {
      turn++;
      console.log(`[Harness] --- Turn ${turn} ---`);

      const result = await this.provider.chat(
        this.transcript,
        this.toolDefinition,
      );
      if (!result) {
        console.log(`[Harness] No response from AI after turn ${turn}`);
        return;
      };

      if (this.onEvent) {
        saveData(result);
        this.onEvent(JSON.stringify(result));
      }

      this.transcript.push(returnedAssistantMessage(result.content, result.tool_call));

      if (result.finishReason == "stop") {
        await this.compactTranscript();
        return result.content || "";
      }

      if (result.finishReason == "tool_calls") {
        console.log(`+++++++++++++++++++\n`);
        console.log(`[Harness] Executing ${result.tool_call?.length ?? 0} tool call(s) in parallel...`);
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

            console.log(`+++++++++++++++++++\n\n\n`);
            console.log('Executing Tool : ', tool.function.name);

            try {
              const toolOutput = await match.implementation(
                JSON.parse(tool.function.arguments),
                { emit: this.onEvent, workspaceRoot: "/home/user/next-app", sandboxId: this.sandboxId }
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
        console.log(`[Harness AFTER PARALLEL EXECUTION RESPONDED WITH : ] `, toolResults);
        console.log(`+++++++++++++++++++++++++++++++++`);
      }
    }
  }


  private async compactTranscript() {
    if (this.transcript.length > 100) {
      // Keeping the first 10 messages
      let savedMessages: Message[] = [];
      const keepFirstCount = Math.min(10, this.transcript.length);
      for (let i = 0; i < keepFirstCount; i++) {
        savedMessages.push(this.transcript[i]!);
      }

      // Keeping the last 20 messages
      const keepLastCount = 20;
      

      const middleMessages = this.transcript.slice(keepFirstCount, -keepLastCount);
      const trailingMessages = this.transcript.slice(-keepLastCount);

      console.log(`[Harness] Compacting ${middleMessages.length} intermediate messages...`);
      const response = await this.compact(middleMessages);
      
      if (response) {
        // Append summary as system context
        savedMessages.push({
          role: "system",
          content: `[System Update: The preceding conversation history has been compacted. Summary of progress and choices made during those steps:\n${response}]`,
        });
      }

      // Append the active trailing messages back
      savedMessages.push(...trailingMessages);

      // Replace the transcript with the compacted version
      this.transcript = savedMessages;
      console.log(`[Harness] Compacted transcript down to ${this.transcript.length} messages.`);
    }
  }

  private async compact(messages: Message[]) {
    const client = new OpenAI();
    // Serialize messages cleanly so the LLM doesn't just receive '[object Object]'
    const formattedHistory = messages
      .map((m) => {
        let text = `${m.role.toUpperCase()}: `;
        if (m.content) {
          text += m.content;
        } else if (m.role === "assistant" && m.tool_calls) {
          text += `Requested tools: ${JSON.stringify(m.tool_calls)}`;
        }
        return text;
      })
      .join("\n---\n");

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a compaction agent. Your job is to take the messages given below and write a highly concise summary of what was accomplished, what files were created or modified, and any architectural decisions made. Keep the summary under 300 words.",
        },
        {
          role: "user",
          content: formattedHistory,
        },
      ],
    });

    let compactMessage;
    if (response.choices[0]) {
      compactMessage = response.choices[0].message.content;
    }
    return compactMessage;
  }

}


export { Harness };


