type Message = UserMessage | AssistantMessage | ToolMessage | SystemMessage

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
  type: string,
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

interface ModelProvider {
  name: () => string,
  chat : (message : Message[], tools : ToolDefiniton[]) => Promise<any>
}

export type {
  Message,
  ToolDefiniton,
  ToolCall,
  ModelProvider,
}