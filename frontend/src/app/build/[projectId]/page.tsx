"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSandboxUrl, submitAnswer, streamAgentCreate, streamAgentUpdate } from "@/api/client";
import ChatPanel from "@/components/build/ChatPanel";
import PreviewPanel from "@/components/build/PreviewPanel";
import { MessageItem, BuildStatus } from "@/components/build/types";

function BuildContent() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState<string | null>(null);

  useEffect(() => {
      const queryPrompt = searchParams.get("prompt");
      const storedPrompt = sessionStorage.getItem(`prompt-${projectId}`);
      console.log("[Build] queryPrompt:", queryPrompt, "storedPrompt:", storedPrompt);
      setPrompt(storedPrompt || queryPrompt);
  }, [projectId, searchParams]);

  console.log("[Build] render | prompt:", prompt, "projectId:", projectId);
  
  const [status, setStatus] = useState<BuildStatus>("idle");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  console.log("[Build] messages state:", messages);
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingAnswerId, setSubmittingAnswerId] = useState<string | null>(null);

  const [updatePrompt, setUpdatePrompt] = useState("");

  const buildStarted = useRef(false);
  const sandboxUrlRef = useRef<string | null>(null);

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

  // Poll for the sandbox URL
  useEffect(() => {
    let intervalId: any;

    const checkUrl = async () => {
      try {
        const data = await getSandboxUrl();
        if (data.success && data.url) {
          setSandboxUrl(data.url);
        }
      } catch (err) {
        console.error("Failed to fetch sandbox URL:", err);
      }
    };

    checkUrl();
    intervalId = setInterval(checkUrl, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Start building when the page mounts with valid parameters
  useEffect(() => {
    if (buildStarted.current) return;
    if (!prompt || !projectId) return;

    buildStarted.current = true;
    startBuild();
  }, [prompt, projectId]);

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
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
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
        sandboxUrl={sandboxUrl}
        onReload={reloadIframe}
      />
    </div>
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
