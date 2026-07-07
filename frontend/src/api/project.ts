import axios from "axios";
import { getAuthHeaders } from "./client";

const API_BASE_URL = "http://localhost:3001/v1/api";

export interface Project {
  id: string;
  name: string;
  userId: string;
  sandboxId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  messages: Message[];
}

export interface ProjectDetails extends Project {
  conversation: Conversation | null;
}

export const getUserProjects = async (): Promise<{ success: boolean; data: Project[] }> => {
  const response = await axios.get(`${API_BASE_URL}/project`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getProjectDetails = async (projectId: string): Promise<{ success: boolean; data: ProjectDetails }> => {
  const response = await axios.get(`${API_BASE_URL}/project/${projectId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
