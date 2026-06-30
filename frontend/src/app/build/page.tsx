"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, ExternalLink, Monitor, Tablet, Smartphone, Copy, Check, Loader2, Terminal, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSandboxUrl, submitAnswer, streamAgentCreate, streamAgentUpdate, AgentResponse } from "@/api/client";

interface MessageItem {
  id: string;
  role: "user" | "assistant" | "system" | "tool" | "status";
  content?: string;
  timestamp: Date;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: any;
  }>;
  question?: string;
  correlationId?: string;
  answerSubmitted?: boolean;
}

type BuildStatus = "idle" | "running" | "waiting" | "completed" | "error";

function BuildContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt");
  const roomId = searchParams.get("roomId");

  const [status, setStatus] = useState<BuildStatus>("idle");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingAnswerId, setSubmittingAnswerId] = useState<string | null>(null);

  const [updatePrompt, setUpdatePrompt] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
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
    if (!updatePrompt.trim() || !roomId) return;

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
      roomId,
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

  // Scroll to bottom of chat whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Start building when the page mounts with valid parameters
  useEffect(() => {
    if (buildStarted.current) return;
    if (!prompt || !roomId) return;

    buildStarted.current = true;
    startBuild();
  }, [prompt, roomId]);

  const startBuild = async () => {
    if (!prompt || !roomId) return;
    
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
      roomId,
      (msg) => {
        // Handle normal assistant message
        setMessages((prev) => {
          // If this is a tool execution finished state or updates
          const isToolCall = !!msg.tool_call?.length;
          
          return [
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
          ];
        });

        // Set status to running if not waiting
        setStatus((current) => (current === "waiting" ? "waiting" : "running"));
      },
      (q) => {
        // Handle question prompt from agent
        setMessages((prev) => [
          ...prev,
          {
            id: q.correlationId,
            role: "assistant",
            content: undefined,
            question: q.question,
            correlationId: q.correlationId,
            timestamp: new Date(),
          },
        ]);
        setStatus("waiting");
      },
      () => {
        // Stream closed successfully
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
        // Handle stream error
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
      
      // Update local messages state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.correlationId === correlationId
            ? { ...msg, answerSubmitted: true, content: `Answer submitted: "${answer.trim()}"` }
            : msg
        )
      );
      
      // Clear local text and restore status to running
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

  const handleCopyUrl = () => {
    if (!sandboxUrl) return;
    navigator.clipboard.writeText(sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      <div className="flex flex-col w-1/3 h-full border-r border-white/10 bg-[#050505] min-w-[350px] max-w-[550px] relative z-10">
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#080808]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-zinc-900 hover:text-white"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold tracking-widest text-zinc-500">LOBABLE v1.0</span>
              <span className="text-sm font-light text-zinc-200">Sandbox Builder</span>
            </div>
          </div>
          
          {/* Pulsing state dot */}
          <div className="flex items-center gap-2 border border-white/5 bg-black px-2.5 py-1 rounded-full text-xs font-mono">
            <span className={`size-2 rounded-full ${
              status === "running" ? "bg-white animate-pulse" :
              status === "waiting" ? "bg-zinc-300 animate-bounce" :
              status === "completed" ? "bg-zinc-500" :
              status === "error" ? "bg-zinc-500 border border-white" :
              "bg-zinc-800"
            }`} />
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              {status}
            </span>
          </div>
        </div>

        {/* Scrollable logs area */}
        <ScrollArea ref={scrollRef} className="flex-1 min-h-0 p-4">
          <div className="space-y-6 pb-8">
            {messages.map((msg, index) => {
              if (msg.role === "status") {
                return (
                  <div key={msg.id || index} className="flex items-start gap-2.5 text-zinc-500 font-mono text-[11px] leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-white/5">
                    <Terminal className="size-3.5 mt-0.5 shrink-0 text-zinc-600" />
                    <span>{msg.content}</span>
                  </div>
                );
              }

              const isUser = msg.role === "user";

              return (
                <div key={msg.id || index} className={`flex flex-col space-y-1.5 ${isUser ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] font-mono text-zinc-600 px-1">
                    {isUser ? "You" : "Orchestrator"} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {isUser ? (
                    <div className="max-w-[85%] border border-white/20 bg-zinc-950 text-zinc-200 px-4 py-3 rounded-2xl rounded-tr-sm text-sm font-light leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[90%] space-y-3">
                      {/* Regular text contents */}
                      {msg.content && (
                        <div className="border border-white/5 bg-zinc-950/40 text-zinc-300 px-4 py-3 rounded-2xl rounded-tl-sm text-sm font-light leading-relaxed">
                          {msg.content}
                        </div>
                      )}

                      {/* Question dialog */}
                      {msg.question && !msg.answerSubmitted && (
                        <div className="w-full border border-white/20 bg-zinc-950 p-4 rounded-xl space-y-3 shadow-lg">
                          <p className="text-sm font-medium text-white">{msg.question}</p>
                          <div className="relative">
                            <Textarea
                              placeholder="Type your reply..."
                              value={answers[msg.correlationId!] || ""}
                              onChange={(e) => setAnswers(prev => ({ ...prev, [msg.correlationId!]: e.target.value }))}
                              className="bg-black border border-white/10 text-zinc-200 placeholder-zinc-700 min-h-[70px] max-h-[150px] focus-visible:ring-0 focus-visible:border-white/30 text-xs rounded-lg"
                            />
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                disabled={submittingAnswerId === msg.correlationId || !answers[msg.correlationId!]?.trim()}
                                onClick={() => handleAnswerSubmit(msg.correlationId!)}
                                className="h-7 bg-white text-black hover:bg-zinc-200 text-xs gap-1 font-mono rounded-md"
                              >
                                {submittingAnswerId === msg.correlationId ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Send className="size-3" />
                                )}
                                Submit
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tool Executions Info */}
                      {msg.toolCalls && msg.toolCalls.map((tc) => (
                        <div key={tc.id} className="text-[11px] font-mono border border-white/5 bg-black/60 text-zinc-400 px-3 py-2 rounded-lg flex items-center gap-2">
                          <span className="size-1.5 bg-zinc-400 rounded-full animate-ping" />
                          <span>
                            Running: <strong className="text-white">{tc.name}</strong>
                            {tc.arguments.task && ` (${tc.arguments.task.slice(0, 30)}...)`}
                            {tc.arguments.path && ` [${tc.arguments.path.split('/').pop()}]`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Chat update input */}
        <form onSubmit={handleUpdateSubmit} className="p-3 border-t border-white/10 bg-[#080808]">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black p-1.5 focus-within:border-white/20 transition-colors">
            <Textarea
              placeholder={
                status === "running" ? "Agent is running..." :
                status === "waiting" ? "Reply to the question above..." :
                "Ask to make changes (e.g., make it dark mode)..."
              }
              value={updatePrompt}
              onChange={(e) => setUpdatePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleUpdateSubmit(e);
                }
              }}
              disabled={status === "running" || status === "waiting"}
              className="w-full min-h-[50px] max-h-[120px] resize-none bg-transparent border-0 text-zinc-200 placeholder-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs p-2 focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-2 pt-1 border-t border-white/5 mt-1">
              <span className="text-[10px] text-zinc-600 font-mono">
                Press Enter to send
              </span>
              <Button
                type="submit"
                disabled={status === "running" || status === "waiting" || !updatePrompt.trim()}
                size="icon"
                variant="ghost"
                className="size-6 rounded-md bg-white text-black hover:bg-zinc-200 hover:text-black disabled:bg-zinc-900 disabled:text-zinc-600 transition-all duration-200"
              >
                <Send className="size-3" />
              </Button>
            </div>
          </div>
        </form>
        
        {/* Sidebar Status Footer */}
        <div className="border-t border-white/10 px-4 py-3 bg-[#080808] flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Logs session active</span>
          {status === "running" && (
            <span className="flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              compiling...
            </span>
          )}
        </div>
      </div>

      {/* RIGHT 2/3 Panel - Application Showcase */}
      <div className="flex-1 flex flex-col bg-black h-screen relative">
        
        {/* Mock Browser Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#050505]">
          <div className="flex items-center gap-4 flex-1">
            {/* URL Address Bar */}
            <div className="flex-1 max-w-xl flex items-center border border-white/10 rounded-lg bg-black px-3 py-1 text-xs text-zinc-400 font-mono select-none">
              <span className="text-zinc-700 mr-1 select-none">preview:</span>
              <span className="truncate flex-1">{sandboxUrl || "Loading environment..."}</span>
              {sandboxUrl && (
                <button
                  onClick={handleCopyUrl}
                  className="ml-2 hover:text-white transition-colors"
                  title="Copy URL"
                >
                  {copied ? <Check className="size-3 text-zinc-300" /> : <Copy className="size-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Browser controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-zinc-900 hover:text-white"
              onClick={() => {
                if (sandboxUrl) {
                  const frame = document.getElementById("preview-frame") as HTMLIFrameElement;
                  if (frame) frame.src = sandboxUrl;
                }
              }}
              disabled={!sandboxUrl}
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-zinc-900 hover:text-white"
              onClick={() => sandboxUrl && window.open(sandboxUrl, "_blank")}
              disabled={!sandboxUrl}
            >
              <ExternalLink className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Viewport content */}
        <div className="flex-1 bg-black flex items-center justify-center p-4">
          <div className="h-full w-full border border-white/10 rounded-xl overflow-hidden bg-zinc-950 flex flex-col shadow-2xl">
            {sandboxUrl ? (
              <iframe
                id="preview-frame"
                src={sandboxUrl}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black gap-4 text-center px-6">
                <div className="relative">
                  <div className="size-10 border border-white/20 border-t-white rounded-full animate-spin" />
                  <Terminal className="size-4 text-white absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-100">Sandbox Environment Starting</p>
                  <p className="text-xs text-zinc-500 font-mono max-w-sm leading-relaxed">
                    Connecting to the remote host. This can take up to 2-3 minutes as Next.js initializes inside the sandbox.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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
