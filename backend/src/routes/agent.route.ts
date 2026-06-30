import { Router } from "express";

import type { Request, Response } from "express";
import { resolveResponse } from "../utils/pendingResponse";
import OpenAIProvider from "../ai/providers/openai";
import { Harness } from "../ai/harness/harness";
import { toolsDefinition } from "../ai/tools/toolDefinition";
import { mainAgentTools } from "../ai/tools/toolImplementation";
import { MAIN_AGENT_SYSTEM_PROMPT } from "../ai/prompt/mainAgentPrompt";
import { getSandbox } from "../utils/e2b";

const router = Router();

export const clientMap = new Map<string, Response>();
const sandboxMap = new Map<string, string>();

router.post("/create", async (req: Request, res: Response) => {
  const promptPreview = req.body?.prompt?.slice(0, 40) ?? "";
  const body = req.body;

  if (!body.prompt) {
    return res.status(400).send("prompt is required");
  }

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

router.get("/sandbox-url", async (req: Request, res: Response) => {
  try {
    const sandbox = await getSandbox();
    const url = sandbox.getHost(3000);
    return res.status(200).json({
      success: true,
      url: `https://${url}`
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Failed to get sandbox URL"
    });
  }
});

export default router;

