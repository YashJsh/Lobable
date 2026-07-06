import { Router } from "express";
import type { Request, Response } from "express";
import { resolveResponse } from "../utils/pendingResponse";
import OpenAIProvider from "../ai/providers/openai";
import { Harness } from "../ai/harness/harness";
import { toolsDefinition } from "../ai/tools/toolDefinition";
import { IGNORE, mainAgentTools } from "../ai/tools/toolImplementation";
import { MAIN_AGENT_SYSTEM_PROMPT } from "../ai/prompt/mainAgentPrompt";
import { getSandbox } from "../utils/e2b";
import { saveData } from "../utils/conversation";
import { GroqProvider } from "../ai/providers/groq";
import { createProject, saveMessage } from "../utils/db";
import { prisma } from "../utils/prisma";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

export const clientMap = new Map<string, Response>();
export const harnessMap = new Map<string, Harness>();

router.post("/create", authMiddleware, async (req: Request, res: Response) => {
  const body = req.body;
  if (!body.prompt) {
    return res.status(400).send("prompt is required");
  }

  const projectId = body.projectId;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clientMap.set(projectId, res);

  // Read authenticated user ID directly from middleware context
  const userId = req.userId!;

  // Resolve E2B sandbox session
  const sandboxInstance = await getSandbox();
  const sandboxId = sandboxInstance.sandboxId;

  // Create Project in Database
  await createProject(
    projectId,
    body.projectName || "New Project",
    userId,
    sandboxId
  );

  saveData({
    username: userId,
    projectId: body.projectId,
    createdAt: Date.now().toString()
  });

  // Save the user message to database
  await saveMessage(projectId, "USER", body.prompt);

  const modelName = body.model;
  let provider;
  if (body.provider === "openai" || (modelName && (modelName.toLowerCase().includes("gpt") || modelName.toLowerCase().includes("openai")))) {
    provider = new OpenAIProvider(1, modelName || "gpt-4o-mini");
  } else {
    provider = new GroqProvider(1, modelName || "openai/gpt-oss-120b");
  }

  const harness = new Harness(
    provider,
    toolsDefinition,
    mainAgentTools,
    MAIN_AGENT_SYSTEM_PROMPT,
    (event) => {
      const client = clientMap.get(projectId);
      if (client) { 
        if (typeof event === "string" && event.startsWith("data:")) {
          client.write(event);
        } else {
          client.write(`data: ${event}\n\n`);
        }
      }
    },
    sandboxId
  );

  harnessMap.set(projectId, harness);

  const response = await harness.sendMessage(body.prompt);

  // Save final assistant message to database
  if (response) {
    await saveMessage(projectId, "ASSISTANT", response);
  }

  console.log(`[Route] POST /create | complete`);
  res.write(`data: ${JSON.stringify(response)}\n\n`);
  res.end();
});

router.post("/update", authMiddleware, async (req: Request, res: Response) => {
  const body = req.body;
  const projectId = body.projectId;
  if (!projectId || !body.prompt) {
    return res.status(400).send("projectId and prompt are required");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clientMap.set(projectId, res);

  let harness = harnessMap.get(projectId);
  let sandboxId: string | undefined;

  // Retrieve project from Database to get sandboxId
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (project) {
    sandboxId = project.sandboxId;
  }

  if (!harness) {
    if (!project) {
      return res.status(404).send("Project not found in database");
    }

    const modelName = body.model;
    let provider;
    if (body.provider === "openai" || (modelName && (modelName.toLowerCase().includes("gpt") || modelName.toLowerCase().includes("openai")))) {
      provider = new OpenAIProvider(1, modelName || "gpt-4o-mini");
    } else {
      provider = new GroqProvider(1, modelName || "openai/gpt-oss-120b");
    }

    harness = new Harness(
      provider,
      toolsDefinition,
      mainAgentTools,
      MAIN_AGENT_SYSTEM_PROMPT,
      (event) => {
        const client = clientMap.get(projectId);
        if (client) { 
          if (typeof event === "string" && event.startsWith("data:")) {
            client.write(event);
          } else {
            client.write(`data: ${event}\n\n`);
          }
        }
      },
      sandboxId
    );
    harnessMap.set(projectId, harness);
  }

  // Save the user message to database
  await saveMessage(projectId, "USER", body.prompt);

  const response = await harness.sendMessage(body.prompt);

  // Save final assistant message to database
  if (response) {
    await saveMessage(projectId, "ASSISTANT", response);
  }

  console.log(`[Route] POST /update | complete`);
  res.write(`data: ${JSON.stringify(response)}\n\n`);
  res.end();
});

router.post("/answer", async (req: Request, res: Response) => {
  const { correlationId, answer } = req.body;
  if (!correlationId || !answer) {
    return res.status(403).json({
      success: false,
      message: "Invalid body"
    })
  };
  await resolveResponse(correlationId, answer);
  return res.status(200).json({
    success: true,
    message: "Answer recieved successfully"
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


router.get("/get_all_files", async (req: Request, res: Response) => {
  try {
    const sandbox = await getSandbox();
    let all = await sandbox.files.list("/home/user/next-app", { depth: 99 });
    const filtered_files = all.filter(f => {
      return !f.path.replace('/home/user/next-app', '').split('/').some(p => IGNORE.includes(p));
    })
    return res.status(200).json({
      success: true,
      data: filtered_files
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Unabe to get the files."
    })
  }
});

router.get("/get_file", async (req: Request, res: Response) => {
  try {
    const path = req.query.path as string;
    if (!path) {
      return res.status(403).json({
        success: false,
        message: "path query param is required"
      });
    }
    const sandbox = await getSandbox();
    const file_response = await sandbox.files.read(path);
    return res.status(200).json({
      success: true,
      data: file_response
    })
  } catch (error : any) {
    return res.status(500).json({
      success : false,
      message : error.message ?? "Internal Server Error"
    })
  }
})

export default router;
