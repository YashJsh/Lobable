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
  private tokens;

  constructor(
    provider: ModelProvider,
    toolDefinition: ToolDefiniton[],
    toolImplementation: ToolImplementation[],
    prompt: string,
    onEvent?: (event : string) => void
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
    this.tokens = 0;
  }

  async sendMessage(input: string) {
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
            
            console.log(`+++++++++++++++++++\n`);
            console.log('Executing Tool : ', tool.function.name);
            
            try {
              const toolOutput = await match.implementation(
                JSON.parse(tool.function.arguments),
                { emit : this.onEvent, workspaceRoot : "/home/user/next-app" }
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
}


export { Harness };
