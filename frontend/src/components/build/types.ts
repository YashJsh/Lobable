export interface MessageItem {
  id: string;
  role: "user" | "assistant" | "system" | "tool" | "status";
  content?: string;
  timestamp: Date;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: any;
  }>;
  question?: string;
  correlationId?: string;
  answerSubmitted?: boolean;
  options?: string[];
}

export type BuildStatus = "idle" | "running" | "waiting" | "completed" | "error";
