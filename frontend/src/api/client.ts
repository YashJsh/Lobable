import axios from "axios";

export const submitAnswer = async (correlationId: string, answer: string) => {
  const response = await axios.post("http://localhost:3001/agent/answer", {
    correlationId,
    answer
  });
  return response.data;
};

export const getSandboxUrl = async () => {
  const response = await axios.get("http://localhost:3001/agent/sandbox-url");
  return response.data;
};

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

export const streamAgentCreate = async (
  prompt: string,
  projectId: string,
  onMessage: (msg: AgentResponse) => void,
  onQuestion: (q: { correlationId: string; question: string; options?: string[] }) => void,
  onClose: () => void,
  onError: (err: any) => void
) => {
  try {
    const response = await fetch("http://localhost:3001/agent/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, projectId }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No readable stream in response");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      console.log("RAW BUFFER:", buffer);
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

     for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        let dataStr = "";

        for (const line of trimmed.split("\n")) {
          if (line.startsWith("data:")){
            const content = line.slice(5).trim();
            dataStr = dataStr ? dataStr + "\n" + content : content;
          }
        }

        console.log("+++++++++++++++++++");
        console.log("Data str is : ", JSON.parse(dataStr));
        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.correlationId && parsed.question) {
              onQuestion({
                correlationId: parsed.correlationId,
                question: parsed.question,
                options: parsed.suggestions || parsed.options,
              });
            }else{
              onMessage(parsed);
            }
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


export const streamAgentUpdate = async (
  prompt: string,
  projectId: string,
  onMessage: (msg: AgentResponse) => void,
  onQuestion: (q: { correlationId: string; question: string; options?: string[] }) => void,
  onClose: () => void,
  onError: (err: any) => void
) => {
  try {
    const response = await fetch("http://localhost:3001/agent/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, projectId }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No readable stream in response");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        let dataStr = "";

        for (const line of trimmed.split("\n")) {
          if (line.startsWith("data:")){
            const content = line.slice(5).trim();
            dataStr = dataStr ? dataStr + "\n" + content : content;
          }
        }
        
        console.log("+++++++++++++++++++");
        console.log("Data str is : ", JSON.parse(dataStr));
        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.correlationId && parsed.question) {
              onQuestion({
                correlationId: parsed.correlationId,
                question: parsed.question,
                options: parsed.suggestions || parsed.options,
              });
            }else{
              onMessage(parsed);
            }
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

export const getAllFiles = async () => {
  const response = await fetch("http://localhost:3001/agent/get_all_files");
  return response.json();
};

export const getFileContent = async (path: string) => {
  const response = await fetch(
    `http://localhost:3001/agent/get_file?path=${encodeURIComponent(path)}`
  );
  return response.json();
};

