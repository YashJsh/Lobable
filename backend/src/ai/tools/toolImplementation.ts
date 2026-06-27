import OpenAI from "openai";
import {Harness} from "../harness/harness";
import type { ToolImplementation } from "../harness/harness.types";
import { SUB_AGENT_SYSTEM_PROMPT } from "../prompt/subAgentPrompt";
import OpenAIProvider from "../providers/openai";
import { subAgentToolsImplementation } from "./subAgentToolImplementation";
import { subAgentToolDefinition } from "./toolDefinition";
import { TODO_AGENT_SYSTEM_PROMPT } from "../prompt/todoAgentSystemPrompt";


const spwaningSubAgent = async (args: unknown) => {
  const {task, description} = args as {
    task: string,
    description : string,
  }
  const provider = new OpenAIProvider(1, "gpt-4.1-mini");
  const harness = new Harness(provider, subAgentToolDefinition, subAgentToolsImplementation, SUB_AGENT_SYSTEM_PROMPT);
  
  const result = await harness.sendMessage(`\n${task}\n${description}`);
  return result;
};

const create_todo = async (args: unknown) => {
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

const askQuestions = async (args: unknown) => {
  const { question } = args as {
    question : string
  }
  const correlationId = crypto.randomUUID();
  // clients.write(
  //   `event: connected\n` +
  //     `data: ${JSON.stringify({
  //       correlationId,
  //       question,
  //     })}\n\n`,
  // );
  // const response = await waitForResponse(correlationId);
  // console.log("Recieved response is : ", response);
  const response = "";
  return response as string;
};

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
  }
];

export {
  mainAgentTools,
  askQuestions
};
