import { Harness } from "../harness/harness";
import type { ToolImplementation } from "../harness/harness.types";
import { SUB_AGENT_SYSTEM_PROMPT } from "../prompt/subAgentPrompt";
import { createProvider } from "../providers";
import { readCommand, subAgentToolsImplementation } from "./subAgentToolImplementation";
import { subAgentToolDefinition } from "./toolDefinition";
import { TODO_AGENT_SYSTEM_PROMPT } from "../prompt/todoAgentSystemPrompt";
import { waitForResponse } from "../../utils/pendingResponse";
import { getFiles } from "./fileTools";


const spwaningSubAgent = async (
  args: unknown,
  options?: {
    emit?: (event: any) => void;
    workspaceRoot?: string;
    sandboxId?: string;
    provider?: string;
  }
) => {
  console.log(`[Spawning Sub Agent] : args are : `, args);
  try {
    const { task, description } = args as {
      task: string,
      description: string,
    }
    const provider = createProvider(options?.provider);
    const harness = new Harness(
      provider,
      subAgentToolDefinition,
      subAgentToolsImplementation,
      SUB_AGENT_SYSTEM_PROMPT.concat(`\nWORKSPACE_ROOT = ${options?.workspaceRoot || "/home/user/next-app"}`),
      options?.sandboxId,
      options?.provider
    );
    const result = await harness.sendMessage(`\n${task}\n${description}`, options?.emit);
    return result || "";
  } catch (error: any) {
    return error as string;
  }
};

const create_task = async (args: unknown, options?: {
  emit?: (event: any) => void;
  provider?: string;
}) => {
  try {
    const provider = createProvider(options?.provider);
    const { prompt } = args as {
      prompt: string
    }
    const result = await provider.chat(
      [{
        role: "system",
        content: TODO_AGENT_SYSTEM_PROMPT
      }, {
        role: "user",
        content: prompt
      }],
      [],
    );

    return result?.content || "NO TODO CREATED";
  }
  catch (error) {
    return error instanceof Error ? error.message : "NO TODO CREATED";
  }
}

const askQuestions = async (args: unknown, options?: {
  emit?: (event: any) => void;
  workspaceRoot?: string
}) => {
  try {
    console.log("[askQuestions] Invoked with arguments:", JSON.stringify(args, null, 2));
    const { question, suggestions: questionOptions } = args as {
      question: string;
      suggestions: string[];
    }
    console.log("Tool question : ", question, "tool Options ", questionOptions);
    const correlationId = crypto.randomUUID();
    if (options?.emit) {
      options.emit(
        `data: ${JSON.stringify({
          correlationId,
          question,
          suggestions: questionOptions,
        })}\n\n`,
      )
    }
    const response = await waitForResponse(correlationId);
    console.log("Recieved response is : ", response);
    return response as string;
  } catch (error: any) {
    return error as string
  }
};

const mainAgentTools: ToolImplementation[] = [
  {
    name: "sub_agent",
    implementation: spwaningSubAgent,
  },
  {
    name: "create_task",
    implementation: create_task
  },
  {
    name: "ask_questions",
    implementation: askQuestions
  },
  {
    name: "get_files",
    implementation: getFiles
  },
  {
    name: "read_file",
    implementation: readCommand
  }
];
export {
  mainAgentTools,
};
