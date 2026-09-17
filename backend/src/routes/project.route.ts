import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authMiddleware } from "../middleware/auth.middleware";
import { killSandbox } from "../utils/e2b";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Failed to retrieve projects",
    });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.id as string;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or unauthorized access",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Failed to retrieve project details",
    });
  }
});

// Delete a project and its associated conversation history
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.id as string;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or unauthorized access",
      });
    }

    await prisma.$transaction(async (tx) => {
      // Delete conversation (which cascades and deletes message logs)
      await tx.conversation.deleteMany({
        where: { projectId },
      });

      // Delete the project
      await tx.project.delete({
        where: { id: projectId },
      });
    });

    // Best-effort sandbox teardown. The database records are already gone, so a
    // failure here must not fail the delete request.
    try {
      await killSandbox(project.sandboxId);
    } catch (error) {
      console.error(
        `[Project] Failed to kill sandbox ${project.sandboxId}:`,
        error
      );
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Failed to delete project",
    });
  }
});

export default router;
