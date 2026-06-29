type Message = UserMessage |  ToolMessage | SystemMessage| AssistantMessage

interface UserMessage {
  role: "user",
  content: string,
}

interface SystemMessage {
  role: "system",
  content: string,
}

interface AssistantMessage {
  role: "assistant",
  content?: string | null;
  name?: string;
  toolCallId?: string;
  tool_calls?: ToolCall[];
}

interface ToolMessage {
  role: "tool",
  content: string,
  tool_call_id: string,
}

interface ToolDefiniton{
  type: "function",
  function: {
    name: string,
    description: string,
    parameters: {
      type: string,
      properties: Record<string, unknown>,
      required: string[],
    },
  },
}

interface ToolCall{
  id: string,
  type: string,
  function: {
    name: string,
    arguments: string,
  },
}

interface ToolImplementation{
  name: string,
  implementation: (args: unknown, options?: {
    emit?: (event: any) => void,
    workspaceRoot? : string
  }) => Promise<string>,
}


interface ModelProvider {
  name: () => string,
  chat : (message : Message[], tools : ToolDefiniton[]) => Promise<ReturnedResponse | void> 
}

interface ReturnedResponse{
  role : "assistant",
  content: string | null,
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | "function_call",
  tool_call? : ToolCall[]
}

export type {
  Message,
  ToolDefiniton,
  ToolCall,
  ModelProvider,
  ToolImplementation,
  ReturnedResponse,
}