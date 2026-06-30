import axios from "axios";

export const submitAnswer = async (correlationId: string, answer: string) => {
  const response = await axios.post("/api/agent/answer", {
    correlationId,
    answer,
  });
  return response.data;
};


export const getSandboxUrl = async () => {
  const response = await axios.get("/api/agent/sandbox-url");
  return response.data;
};

/**
 * Interface representing the structure of responses streamed from the agent.
 */
export interface AgentResponse {
  role: "assistant" | "system" | "tool";
  content: string | null;
  finishReason?: "stop" | "length" | "tool_calls" | "content_filter" | "function_call";
  tool_call?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

/**
 * Connect to the agent creation SSE stream and handle incoming chunks.
 * Uses standard Fetch API to support readable streams in browser environments.
 */
export const streamAgentCreate = async (
  prompt: string,
  roomId: string,
  onMessage: (msg: AgentResponse) => void,
  onQuestion: (q: { correlationId: string; question: string; options?: string[] }) => void,
  onClose: () => void,
  onError: (err: any) => void
) => {
  try {
    const response = await fetch("/api/agent/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, roomId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No readable stream in response");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || ""; // Keep the last incomplete part in the buffer

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        // Split by lines to parse SSE fields
        const lines = trimmed.split("\n");
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const content = line.slice(6).trim();
            if (dataStr) {
              dataStr += "\n" + content;
            } else {
              dataStr = content;
            }
          }
        }

        // Handle the custom "ask_questions" event which comes embedded:
        // event: connected\ndata: {"correlationId": "...", "question": "..."}
        if (trimmed.includes("event: connected")) {
          const jsonMatch = trimmed.match(/{[\s\S]*}/);
          if (jsonMatch) {
            try {
              const questionObj = JSON.parse(jsonMatch[0]);
              if (questionObj.correlationId && questionObj.question) {
                onQuestion({
                  correlationId: questionObj.correlationId,
                  question: questionObj.question,
                  options: questionObj.suggestions || questionObj.options,
                });
                continue;
              }
            } catch (e) {
              console.error("Failed to parse question JSON from chunk:", e);
            }
          }
        }

        // Regular message parsing
        if (dataStr) {
          try {
            // Strip custom SSE prefix if it's there
            if (dataStr.startsWith("event: connected\n")) {
              dataStr = dataStr.slice("event: connected\n".length);
            }
            const parsed = JSON.parse(dataStr);
            onMessage(parsed);
          } catch (e) {
            // Fallback for raw text
            onMessage({ role: "assistant", content: dataStr });
          }
        }
      }
    }
    onClose();
  } catch (error) {
    onError(error);
  }
};

/**
 * Connect to the agent update SSE stream and handle incoming chunks.
 * Uses standard Fetch API to support readable streams in browser environments.
 */
export const streamAgentUpdate = async (
  prompt: string,
  roomId: string,
  onMessage: (msg: AgentResponse) => void,
  onQuestion: (q: { correlationId: string; question: string; options?: string[] }) => void,
  onClose: () => void,
  onError: (err: any) => void
) => {
  try {
    const response = await fetch("/api/agent/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, roomId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No readable stream in response");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const lines = trimmed.split("\n");
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const content = line.slice(6).trim();
            if (dataStr) {
              dataStr += "\n" + content;
            } else {
              dataStr = content;
            }
          }
        }

        if (trimmed.includes("event: connected")) {
          const jsonMatch = trimmed.match(/{[\s\S]*}/);
          if (jsonMatch) {
            try {
              const questionObj = JSON.parse(jsonMatch[0]);
              if (questionObj.correlationId && questionObj.question) {
                onQuestion({
                  correlationId: questionObj.correlationId,
                  question: questionObj.question,
                  options: questionObj.suggestions || questionObj.options,
                });
                continue;
              }
            } catch (e) {
              console.error("Failed to parse question JSON from chunk:", e);
            }
          }
        }

        if (dataStr) {
          try {
            if (dataStr.startsWith("event: connected\n")) {
              dataStr = dataStr.slice("event: connected\n".length);
            }
            const parsed = JSON.parse(dataStr);
            onMessage(parsed);
          } catch (e) {
            onMessage({ role: "assistant", content: dataStr });
          }
        }
      }
    }
    onClose();
  } catch (error) {
    onError(error);
  }
};

