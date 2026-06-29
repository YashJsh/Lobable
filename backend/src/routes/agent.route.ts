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
const sandboxMap = new Map<string, string>();

router.post("/create", async (req: Request, res: Response) => {
  const promptPreview = req.body?.prompt?.slice(0, 40) ?? "";
  console.log(`[Route] POST /create | prompt: "${promptPreview}${promptPreview.length >= 40 ? "..." : ""}"`);

  const body = req.body;

  if (!body.prompt) {
    return res.status(400).send("prompt is required");
  }
  const roomID = body.roomId;
  
  
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
      res.write(`data: ${event}\n\n`);
    }
  );

  const projectId = crypto.randomUUID().toString();
  clientMap.set(projectId, res);
  
  
  const response = await harness.sendMessage(body.prompt);
  console.log(`[Route] POST /create | complete`);
  res.write(`data: ${response}\n\n`);
  res.end();
});

router.post("/answer", async (req: Request, res: Response) => {
  const { correlationId, answer } = req.body;
  console.log(`[Route] POST /answer | correlationId: ${correlationId?.slice(0, 8)}... | answer: "${String(answer ?? "").slice(0, 40)}${String(answer ?? "").length > 40 ? "..." : ""}"`);
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
