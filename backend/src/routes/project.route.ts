import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authMiddleware } from "../middleware/auth.middleware";

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
