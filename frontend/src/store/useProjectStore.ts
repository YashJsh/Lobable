import { create } from "zustand";
import { Project, ProjectDetails, getUserProjects, getProjectDetails, deleteProjectCall } from "@/api/project";
import { MessageItem, BuildStatus } from "@/components/build/types";

interface ProjectState {
  projects: Project[];
  activeProject: ProjectDetails | null;
  messages: MessageItem[];
  status: BuildStatus;
  sandboxUrl: string | null;
  answers: Record<string, string>;
  submittingAnswerId: string | null;
  provider: string;
  error: string | null;
  
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: ProjectDetails | null) => void;
  setMessages: (messages: MessageItem[] | ((prev: MessageItem[]) => MessageItem[])) => void;
  addMessage: (message: MessageItem) => void;
  setStatus: (status: BuildStatus | ((current: BuildStatus) => BuildStatus)) => void;
  setSandboxUrl: (url: string | null) => void;
  setAnswers: (answers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setSubmittingAnswerId: (id: string | null) => void;
  setProvider: (provider: string) => void;
  setError: (error: string | null) => void;

  fetchProjects: () => Promise<void>;
  fetchProjectDetails: (projectId: string) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<void>;
  clearActiveProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  messages: [],
  status: "idle",
  sandboxUrl: null,
  answers: {},
  submittingAnswerId: null,
  provider: "deepseek",
  error: null,

  setProjects: (projects) => set({ projects }),
  setActiveProject: (activeProject) => set({ activeProject }),
  setMessages: (update) => set((state) => ({
    messages: typeof update === "function" ? update(state.messages) : update
  })),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  setStatus: (update) => set((state) => ({
    status: typeof update === "function" ? update(state.status) : update
  })),
  setSandboxUrl: (sandboxUrl) => set({ sandboxUrl }),
  setAnswers: (update) => set((state) => ({
    answers: typeof update === "function" ? update(state.answers) : update
  })),
  setSubmittingAnswerId: (submittingAnswerId) => set({ submittingAnswerId }),
  setProvider: (provider) => set({ provider }),
  setError: (error) => set({ error }),

  fetchProjects: async () => {
    try {
      const res = await getUserProjects();
      if (res.success) {
        set({ projects: res.data, error: null });
      }
    } catch (err) {
      console.error("Failed to fetch user projects:", err);
      set({ error: "Failed to load projects. Please retry." });
    }
  },

  fetchProjectDetails: async (projectId: string) => {
    try {
      const res = await getProjectDetails(projectId);
      if (res.success && res.data) {
        const details = res.data;
        set({ activeProject: details });
        
        // Map database messages to MessageItem format
        if (details.conversation?.messages) {
          const mappedMessages: MessageItem[] = details.conversation.messages.map((m) => {
            const role = m.role.toLowerCase();
            return {
              id: m.id,
              role: role === "user" ? "user" : "assistant",
              content: m.content,
              timestamp: new Date(m.createdAt),
            };
          });
          set({ messages: mappedMessages, status: "completed" });
        } else {
          set({ messages: [], status: "idle" });
        }
        return true;
      }
      return false;
    } catch (err) {
      // Reset stale state before deciding what this failure means.
      set({
        activeProject: null,
        messages: [],
        status: "idle",
        sandboxUrl: null,
      });

      // A 404 means the project does not exist yet (a brand-new project).
      // Anything else is a real failure and is rethrown so callers don't
      // mistake it for a new project and start a duplicate build.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return false;
      }
      console.error(`Failed to fetch project details for ${projectId}:`, err);
      throw err;
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      const res = await deleteProjectCall(projectId);
      if (res.success) {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          activeProject: state.activeProject?.id === projectId ? null : state.activeProject,
          messages: state.activeProject?.id === projectId ? [] : state.messages,
          sandboxUrl: state.activeProject?.id === projectId ? null : state.sandboxUrl,
          status: state.activeProject?.id === projectId ? "idle" : state.status,
          error: null,
        }));
      }
    } catch (err) {
      console.error(`Failed to delete project ${projectId}:`, err);
      set({ error: "Failed to delete project. Please retry." });
    }
  },

  clearActiveProject: () => {
    set({
      activeProject: null,
      messages: [],
      status: "idle",
      sandboxUrl: null,
      answers: {},
      submittingAnswerId: null,
    });
  },
}));
