import type {
  Message,
  ModelProvider,
  ToolDefiniton,
  ToolImplementation,
} from "./harness.types";
import { returnedAssistantMessage, userMessage } from "../utils";
import { saveData } from "../../utils/conversation";

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
        throw new Error("No response from the model provider");
      }

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
    if (this.transcript.length <= 100) return;

    // Keep the first messages (system prompt + initial context) and the most
    // recent messages, summarizing everything in between.
    const keepFirstCount = Math.min(10, this.transcript.length);
    const keepLastCount = 20;

    const savedMessages: Message[] = this.transcript.slice(0, keepFirstCount);
    const middleMessages = this.transcript.slice(keepFirstCount, -keepLastCount);
    const trailingMessages = this.transcript.slice(-keepLastCount);

    console.log(`[Harness] Compacting ${middleMessages.length} intermediate messages...`);

    let summary: string | null = null;
    try {
      summary = await this.summarize(middleMessages);
    } catch (error) {
      // Compaction must never break the turn; fall back to truncation below.
      console.error("[Harness] Compaction failed, truncating history instead:", error);
    }

    savedMessages.push({
      role: "system",
      content: summary
        ? `[System Update: The preceding conversation history has been compacted. Summary of progress and choices made during those steps:\n${summary}]`
        : "[System Update: Older conversation history was dropped to stay within context limits. Re-inspect the workspace before relying on prior details.]",
    });

    // Append the active trailing messages back
    savedMessages.push(...trailingMessages);

    // Replace the transcript with the compacted version
    this.transcript = savedMessages;
    console.log(`[Harness] Compacted transcript down to ${this.transcript.length} messages.`);
  }

  private async summarize(messages: Message[]): Promise<string | null> {
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

    // Reuse the harness's own provider so compaction works regardless of which
    // provider is configured (previously this hardcoded OpenAI).
    const result = await this.provider.chat(
      [
        {
          role: "system",
          content:
            "You are a compaction agent. Your job is to take the messages given below and write a highly concise summary of what was accomplished, what files were created or modified, and any architectural decisions made. Keep the summary under 300 words.",
        },
        {
          role: "user",
          content: formattedHistory,
        },
      ],
      [],
    );

    return result?.content ?? null;
  }

}


export { Harness };


