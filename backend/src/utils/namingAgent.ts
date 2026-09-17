import { createProvider } from "../ai/providers";

const NAMING_SYSTEM_PROMPT =
  "You are a naming agent. The user sends a prompt describing an app. Reply with only a short project name (2-4 words), no quotes, no punctuation, no explanation. Example: 'Build a todo application' -> Todo App";

const getProjectName = async (prompt: string, providerName?: string): Promise<string> => {
  const provider = createProvider(providerName);
  const response = await provider.chat(
    [
      { role: "system", content: NAMING_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    [],
  );
  return response?.content?.trim() || "Untitled Project";
};

export {
  getProjectName
}
