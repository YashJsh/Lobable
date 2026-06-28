import { Router } from "express";

import type { Request, Response } from "express";
import { resolveResponse } from "../utils/pendingResponse";
import OpenAIProvider from "../ai/providers/openai";
import { Harness } from "../ai/harness/harness";
import { toolsDefinition } from "../ai/tools/toolDefinition";
import { mainAgentTools } from "../ai/tools/toolImplementation";
import { MAIN_AGENT_SYSTEM_PROMPT } from "../ai/prompt/mainAgentPrompt";

const router = Router();

export const clientMap = new Map<string, Response>();

router.post("/create", async (req : Request, res : Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const provider = new OpenAIProvider(1, "gpt-4.1-mini");
  const harness = new Harness(
    provider,
    toolsDefinition,
    mainAgentTools,
    MAIN_AGENT_SYSTEM_PROMPT,
    (event) => {
      res.write(event);
    }
  );

  const projectId = crypto.randomUUID().toString();
  clientMap.set(projectId, res);
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).send("prompt is required");
  }
  const response = await harness.sendMessage(prompt);
  res.write(`
    ${response}\n\n
    `)
  res.end();
});

router.post("/answer", async (req: Request, res: Response) => {
  const { correlationId, answer } = req.body;
  if (!correlationId || !answer) {
    return res.status(403).json({
      success: false,
      message : "Invalid body"
    })
  };
  await resolveResponse(correlationId, answer);
  return res.status(200).json({
    success: true,
    message : "Answer recieved successfully"
  })
});

export default router;
