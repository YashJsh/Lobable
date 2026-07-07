import { create } from "zustand";
import { Project, ProjectDetails, getUserProjects, getProjectDetails } from "@/api/project";
import { MessageItem, BuildStatus } from "@/components/build/types";

interface ProjectState {
  projects: Project[];
  activeProject: ProjectDetails | null;
  messages: MessageItem[];
  status: BuildStatus;
  sandboxUrl: string | null;
  answers: Record<string, string>;
  submittingAnswerId: string | null;
  
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: ProjectDetails | null) => void;
  setMessages: (messages: MessageItem[] | ((prev: MessageItem[]) => MessageItem[])) => void;
  addMessage: (message: MessageItem) => void;
  setStatus: (status: BuildStatus | ((current: BuildStatus) => BuildStatus)) => void;
  setSandboxUrl: (url: string | null) => void;
  setAnswers: (answers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setSubmittingAnswerId: (id: string | null) => void;

  fetchProjects: () => Promise<void>;
  fetchProjectDetails: (projectId: string) => Promise<void>;
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

  fetchProjects: async () => {
    try {
      const res = await getUserProjects();
      if (res.success) {
        set({ projects: res.data });
      }
    } catch (err) {
      console.error("Failed to fetch user projects:", err);
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
          set({ messages: mappedMessages });
        } else {
          set({ messages: [] });
        }
      }
    } catch (err) {
      console.error(`Failed to fetch project details for ${projectId}:`, err);
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
