import { Router } from "express";
import { harness } from "../ai/harness/harness";
import type { Request, Response } from "express";
import { resolveResponse } from "../utils/pendingResponse";

const router = Router();

export const clientMap = new Map<string, Response>();

router.post("/create", async (req : Request, res : Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const roomId = crypto.randomUUID().toString();
  clientMap.set(roomId, res);
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
