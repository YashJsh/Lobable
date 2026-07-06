import { prisma } from "./prisma";
import { MessageRole } from "../generated/prisma/client";

export const createProject = async (
  projectId: string,
  name: string,
  userId: string,
  sandboxId: string
) => {
  const {project, conversation} = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        id: projectId,
        name,
        userId,
        sandboxId,
      },
    });
    const conversation = await tx.conversation.create({
      data: {
        projectId: project.id,
      },
    });

    return { project, conversation };
  })
  return {
    project, 
    conversation
  }
};

export const saveMessage = async (
  projectId: string,
  role: "USER" | "ASSISTANT",
  content: string
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { projectId },
  });

  if (!conversation) {
    throw new Error(`Conversation not found for project ID: ${projectId}`);
  }

  return prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: role === "USER" ? MessageRole.USER : MessageRole.ASSISTANT,
      content,
    },
  });
};
