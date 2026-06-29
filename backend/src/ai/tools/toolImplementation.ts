import OpenAI from "openai";
import {Harness} from "../harness/harness";
import type { ToolImplementation } from "../harness/harness.types";
import { SUB_AGENT_SYSTEM_PROMPT } from "../prompt/subAgentPrompt";
import OpenAIProvider from "../providers/openai";
import { readCommand, subAgentToolsImplementation } from "./subAgentToolImplementation";
import { subAgentToolDefinition } from "./toolDefinition";
import { TODO_AGENT_SYSTEM_PROMPT } from "../prompt/todoAgentSystemPrompt";
import { waitForResponse } from "../../utils/pendingResponse";
import type Sandbox from "e2b";
import { getSandbox } from "../../utils/e2b";


const spwaningSubAgent = async (
  args: unknown,
  options?: {
    emit?: (event: any) => void;
    workspaceRoot? : string
  }
) => {
  console.log(`[Spawning Sub Agent] : args are : `, args);
  try {
    const {task, description} = args as {
      task: string,
      description : string,
    }
    const provider = new OpenAIProvider(1, "gpt-4.1-mini");
    const harness = new Harness(provider, subAgentToolDefinition, subAgentToolsImplementation, SUB_AGENT_SYSTEM_PROMPT.concat(`WORKSPACE_ROOT = ${options?.emit}`), options?.emit);
    const result = await harness.sendMessage(`\n${task}\n${description}`);
    return result || "";
  } catch (error: any) {
    return error as string;
  }
};

const create_todo = async (args: unknown) => {
  try {
    const client = new OpenAI();
    const { prompt } = args as {
      prompt : string
    }
    const messages: any = [{
      role: "system",
      content : TODO_AGENT_SYSTEM_PROMPT
    }, {
      role: "user",
      content : prompt
    }];
    
    const response = await client.chat.completions.create({
      messages,
      model: "gpt-4.1-mini",
    })
  
    const choices = response.choices[0];
    if (choices?.finish_reason == "stop") {
      const result = choices.message.content;
      return result as string;
    }
    return "NO TODO CREATED";
  }
  catch (error: any) {
    return error as string
 }
}

const askQuestions = async (args: unknown, options?: {
  emit?: (event: any) => void;
  workspaceRoot? : string
  }) => {
  try {
    const { question } = args as {
      question : string
    }
    const correlationId = crypto.randomUUID();
    if (options?.emit) {
      options.emit(
        `event: connected\n` +
          `data: ${JSON.stringify({
            correlationId,
            question,
          })}\n\n`,
      )
    }
    const response = await waitForResponse(correlationId);
    console.log("Recieved response is : ", response);
    return response as string;
  } catch(error : any) {
    return error as string
  }
};

const IGNORE = ['node_modules', '.next', '.npm', '.config', 'public'];

export const getFiles = async (args: unknown) => {
    const sandbox = await getSandbox();
    let all = await sandbox.files.list("/home/user/react-app", {depth: 99});
    const filtered_files = all.filter(f => {
        return !f.path.replace('/home/user/react-app','').split('/').some(p => IGNORE.includes(p));
    })
    return JSON.stringify(filtered_files);
}


const mainAgentTools: ToolImplementation[] = [
  {
    name: "sub_agent",
    implementation: spwaningSubAgent,
  },
  {
    name: "create_todo",
    implementation : create_todo
  },
  {
    name: "ask_questions",
    implementation : askQuestions
  },
  {
    name: "get_files",
    implementation : getFiles
  },
  {
    name: "read_file",
    implementation : readCommand
  }
];
export {
  mainAgentTools,
};
