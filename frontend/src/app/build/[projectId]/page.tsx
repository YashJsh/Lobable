"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSandboxUrl, submitAnswer, streamAgentCreate, streamAgentUpdate } from "@/api/client";
import ChatPanel from "@/components/build/ChatPanel";
import PreviewPanel from "@/components/build/PreviewPanel";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useProjectStore } from "@/store/useProjectStore";

function BuildContent() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState<string | null>(null);

  const {
    messages,
    status,
    sandboxUrl,
    answers,
    submittingAnswerId,
    setMessages,
    setStatus,
    setSandboxUrl,
    setAnswers,
    setSubmittingAnswerId,
    fetchProjectDetails,
    clearActiveProject,
  } = useProjectStore();

  const [updatePrompt, setUpdatePrompt] = useState("");
  const buildStarted = useRef(false);
  const sandboxUrlRef = useRef<string | null>(null);

  // 1. Fetch project details / transcripts from database on mount or route transition
  useEffect(() => {
    if (projectId) {
      fetchProjectDetails(projectId);
    }
    return () => {
      clearActiveProject();
      buildStarted.current = false;
    };
  }, [projectId, fetchProjectDetails, clearActiveProject]);

  // 2. Fetch initial prompt from search params or session storage
  useEffect(() => {
    const queryPrompt = searchParams.get("prompt");
    const storedPrompt = sessionStorage.getItem(`prompt-${projectId}`);
    setPrompt(storedPrompt || queryPrompt);
  }, [projectId, searchParams]);

  useEffect(() => {
    sandboxUrlRef.current = sandboxUrl;
  }, [sandboxUrl]);

  const reloadIframe = () => {
    const frame = document.getElementById("preview-frame") as HTMLIFrameElement;
    const currentUrl = sandboxUrlRef.current;
    if (frame && currentUrl) {
      try {
        const url = new URL(currentUrl);
        url.searchParams.set("t", Date.now().toString());
        frame.src = url.toString();
      } catch {
        frame.src = currentUrl;
      }
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatePrompt.trim() || !projectId) return;

    const currentPrompt = updatePrompt.trim();
    setUpdatePrompt("");
    setStatus("running");

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        role: "user",
        content: currentPrompt,
        timestamp: new Date(),
      },
      {
        id: Math.random().toString(),
        role: "status",
        content: "Sending update instructions to agent...",
        timestamp: new Date(),
      }
    ]);

    await streamAgentUpdate(
      currentPrompt,
      projectId,
      (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: msg.role,
            content: msg.content || undefined,
            toolCalls: msg.tool_call?.map((tc) => {
              let parsedArgs = {};
              try {
                parsedArgs = JSON.parse(tc.function.arguments || "{}");
              } catch {
                parsedArgs = { raw: tc.function.arguments };
              }
              return {
                id: tc.id,
                name: tc.function.name,
                arguments: parsedArgs,
              };
            }),
            timestamp: new Date(),
          },
        ]);
        setStatus((current) => (current === "waiting" ? "waiting" : "running"));
      },
      (q) => {
        setMessages((prev) => [
          ...prev,
          {
            id: q.correlationId,
            role: "assistant",
            content: undefined,
            question: q.question,
            correlationId: q.correlationId,
            options: q.options,
            timestamp: new Date(),
          },
        ]);
        setStatus("waiting");
      },
      () => {
        setStatus("completed");
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: "status",
            content: "Update successfully applied.",
            timestamp: new Date(),
          },
        ]);
        reloadIframe();
      },
      (err) => {
        setStatus("error");
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: "status",
            content: `Error during update: ${err.message || "Failed to communicate with agent."}`,
            timestamp: new Date(),
          },
        ]);
      }
    );
  };

  // Fetch sandbox URL once build completes or loads from history
  useEffect(() => {
    if (sandboxUrl) return;
    if (status !== "completed") return;

    const fetchUrl = async () => {
      try {
        const data = await getSandboxUrl(projectId);
        if (data.success && data.url) {
          setSandboxUrl(data.url);
        }
      } catch (err) {
        console.error("Failed to fetch sandbox URL:", err);
      }
    };

    fetchUrl();
  }, [projectId, status, sandboxUrl, setSandboxUrl]);

  // Start building when the page mounts with valid parameters (only if no existing messages)
  useEffect(() => {
    if (buildStarted.current) return;
    if (!prompt || !projectId) return;
    if (messages.length > 0) return; // Prevent double trigger if project is loaded from history

    buildStarted.current = true;
    startBuild();
  }, [prompt, projectId, messages.length]);

  const startBuild = async () => {
    if (!prompt || !projectId) return;

    setStatus("running");

    // Add initial user message
    setMessages([
      {
        id: "initial-prompt",
        role: "user",
        content: prompt,
        timestamp: new Date(),
      },
      {
        id: "status-init",
        role: "status",
        content: "Initializing orchestrator agent...",
        timestamp: new Date(),
      }
    ]);

    await streamAgentCreate(
      prompt,
      projectId,
      (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: msg.role,
            content: msg.content || undefined,
            toolCalls: msg.tool_call?.map((tc) => {
              let parsedArgs = {};
              try {
                parsedArgs = JSON.parse(tc.function.arguments || "{}");
              } catch {
                parsedArgs = { raw: tc.function.arguments };
              }
              return {
                id: tc.id,
                name: tc.function.name,
                arguments: parsedArgs,
              };
            }),
            timestamp: new Date(),
          },
        ]);

        setStatus((current) => (current === "waiting" ? "waiting" : "running"));
      },
      (q) => {
        setMessages((prev) => [
          ...prev,
          {
            id: q.correlationId,
            role: "assistant",
            content: undefined,
            question: q.question,
            correlationId: q.correlationId,
            options: q.options,
            timestamp: new Date(),
          },
        ]);
        setStatus("waiting");
      },
      () => {
        setStatus("completed");
        setMessages((prev) => [
          ...prev,
          {
            id: "status-completed",
            role: "status",
            content: "Deployment complete. Application is running.",
            timestamp: new Date(),
          },
        ]);
        reloadIframe();
      },
      (err) => {
        setStatus("error");
        setMessages((prev) => [
          ...prev,
          {
            id: "status-error",
            role: "status",
            content: `Error: ${err.message || "Failed to communicate with agent stream."}`,
            timestamp: new Date(),
          },
        ]);
      }
    );
  };

  const handleAnswerSubmit = async (correlationId: string) => {
    const answer = answers[correlationId];
    if (!answer || !answer.trim()) return;

    setSubmittingAnswerId(correlationId);
    try {
      await submitAnswer(correlationId, answer.trim());

      setMessages((prev) =>
        prev.map((msg) =>
          msg.correlationId === correlationId
            ? { ...msg, answerSubmitted: true, content: `Answer submitted: "${answer.trim()}"` }
            : msg
        )
      );

      setAnswers((prev) => {
        const copy = { ...prev };
        delete copy[correlationId];
        return copy;
      });
      setStatus("running");
    } catch (error) {
      console.error("Failed to submit answer:", error);
      alert("Failed to submit answer. Please try again.");
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  const handleOptionSubmit = async (correlationId: string, opt: string) => {
    setAnswers(prev => ({ ...prev, [correlationId]: opt }));
    setSubmittingAnswerId(correlationId);
    try {
      await submitAnswer(correlationId, opt);
      setMessages((prev) =>
        prev.map((m) =>
          m.correlationId === correlationId
            ? { ...m, answerSubmitted: true, content: `Answer submitted: "${opt}"` }
            : m
        )
      );
      setStatus("running");
    } catch (error) {
      console.error("Failed to submit answer:", error);
      alert("Failed to submit answer. Please try again.");
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  return (
    <DashboardShell>
      <div className="flex-1 flex overflow-hidden relative">
        <ChatPanel
          status={status}
          messages={messages}
          answers={answers}
          submittingAnswerId={submittingAnswerId}
          updatePrompt={updatePrompt}
          onUpdatePromptChange={setUpdatePrompt}
          onUpdateSubmit={handleUpdateSubmit}
          onAnswerChange={(correlationId, val) => setAnswers(prev => ({ ...prev, [correlationId]: val }))}
          onAnswerSubmit={handleAnswerSubmit}
          onOptionSubmit={handleOptionSubmit}
          onBack={() => router.push("/")}
        />
        <PreviewPanel
          projectId={projectId}
          sandboxUrl={sandboxUrl}
          status={status}
          onReload={reloadIframe}
        />
      </div>
    </DashboardShell>
  );
}

export default function BuildPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-500 font-mono gap-3">
        <Loader2 className="size-6 animate-spin text-white" />
        <span>Loading workspace...</span>
      </div>
    }>
      <BuildContent />
    </React.Suspense>
  );
}
