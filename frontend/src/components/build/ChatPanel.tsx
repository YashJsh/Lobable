"use client";

import React, { useRef, useEffect } from "react";
import { ArrowLeft, Loader2, Terminal, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MessageItem, BuildStatus } from "./types";

interface ChatPanelProps {
  status: BuildStatus;
  messages: MessageItem[];
  answers: Record<string, string>;
  submittingAnswerId: string | null;
  updatePrompt: string;
  onUpdatePromptChange: (val: string) => void;
  onUpdateSubmit: (e: React.FormEvent) => void;
  onAnswerChange: (correlationId: string, val: string) => void;
  onAnswerSubmit: (correlationId: string) => void;
  onOptionSubmit: (correlationId: string, option: string) => void;
  onBack: () => void;
}

const statusBadgeVariant: Record<BuildStatus, "secondary" | "outline" | "default" | "destructive"> = {
  idle: "outline",
  running: "default",
  waiting: "secondary",
  completed: "outline",
  error: "destructive",
};

const statusDotClass: Record<BuildStatus, string> = {
  idle: "bg-zinc-800",
  running: "bg-white animate-pulse",
  waiting: "bg-zinc-300 animate-bounce",
  completed: "bg-zinc-500",
  error: "bg-zinc-500 border border-white",
};

export default function ChatPanel({
  status,
  messages,
  answers,
  submittingAnswerId,
  updatePrompt,
  onUpdatePromptChange,
  onUpdateSubmit,
  onAnswerChange,
  onAnswerSubmit,
  onOptionSubmit,
  onBack,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col w-1/3 h-full border-r border-white/10 bg-[#050505] min-w-[350px] max-w-[550px] relative z-10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#080808]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg hover:bg-zinc-900 hover:text-white"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold tracking-widest text-zinc-500">LOBABLE v1.0</span>
            <span className="text-sm font-light text-zinc-200">Sandbox Builder</span>
          </div>
        </div>

        <Badge
          variant={statusBadgeVariant[status]}
          className="gap-1.5 border-white/10 bg-black/60 text-zinc-400 font-mono text-[10px] uppercase tracking-wider"
        >
          <span className={`size-1.5 rounded-full ${statusDotClass[status]}`} />
          {status}
        </Badge>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 p-4">
        <div className="space-y-6 pb-8">
          {messages.map((msg, index) => {
            if (msg.role === "status") {
              return (
                <div
                  key={msg.id || index}
                  className="flex items-start gap-2.5 text-zinc-500 font-mono text-[11px] leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-white/5"
                >
                  <Terminal className="size-3.5 mt-0.5 shrink-0 text-zinc-600" />
                  <span>{msg.content}</span>
                </div>
              );
            }

            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col space-y-1.5 ${isUser ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] font-mono text-zinc-600 px-1">
                  {isUser ? "You" : "Orchestrator"} •{" "}
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>

                {isUser ? (
                  <div className="max-w-[85%] border border-white/20 bg-zinc-950 text-zinc-200 px-4 py-3 rounded-2xl rounded-tr-sm text-sm font-light leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[90%] space-y-3">
                    {msg.content && (
                      <div className="border border-white/5 bg-zinc-950/40 text-zinc-300 px-4 py-3 rounded-2xl rounded-tl-sm text-sm font-light leading-relaxed">
                        {msg.content}
                      </div>
                    )}

                    {msg.question && !msg.answerSubmitted && (
                      <div className="w-full border border-white/20 bg-zinc-950 p-4 rounded-xl space-y-3 shadow-lg">
                        <p className="text-sm font-medium ">{msg.question}</p>

                        {msg.options && msg.options.length > 0 && (
                          <div className="flex flex-col gap-2 pt-1 pb-1">
                            {msg.options.map((opt) => (
                              <Button
                                key={opt}
                                variant="outline"
                                disabled={submittingAnswerId === msg.correlationId}
                                onClick={() => onOptionSubmit(msg.correlationId!, opt)}
                                className="w-full justify-start text-xs border-white/10 hover:bg-white hover:text-white transition-all bg-black text-zinc-300 font-sans h-auto py-2.5 px-3.5 whitespace-normal text-left"
                              >
                                {opt}
                              </Button>
                            ))}
                            <div className="flex items-center gap-2 my-1.5">
                              <Separator className="flex-1 bg-white/5" />
                              <span className="text-[10px] text-zinc-600 font-mono shrink-0">OR</span>
                              <Separator className="flex-1 bg-white/5" />
                            </div>
                          </div>
                        )}

                        <div className="relative">
                          <Textarea
                            placeholder="Type a custom reply..."
                            value={answers[msg.correlationId!] || ""}
                            onChange={(e) => onAnswerChange(msg.correlationId!, e.target.value)}
                            className="bg-black border border-white/10 text-zinc-200 placeholder-zinc-700 min-h-[70px] max-h-[150px] focus-visible:ring-0 focus-visible:border-white/30 text-xs rounded-lg"
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              disabled={
                                submittingAnswerId === msg.correlationId ||
                                !answers[msg.correlationId!]?.trim()
                              }
                              onClick={() => onAnswerSubmit(msg.correlationId!)}
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

                    {msg.toolCalls &&
                      msg.toolCalls.map((tc) => (
                        <div
                          key={tc.id}
                          className="text-[11px] font-mono border border-white/5 bg-black/60 text-zinc-400 px-3 py-2 rounded-lg flex items-center gap-2"
                        >
                          <span className="size-1.5 bg-zinc-400 rounded-full animate-ping" />
                          <span>
                            Running: <strong className="text-white">{tc.name}</strong>
                            {tc.arguments.task && ` (${tc.arguments.task.slice(0, 30)}...)`}
                            {tc.arguments.path && ` [${tc.arguments.path.split("/").pop()}]`}
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

      <form onSubmit={onUpdateSubmit} className="p-3 border-t border-white/10 bg-[#080808]">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black p-1.5 focus-within:border-white/20 transition-colors">
          <Textarea
            placeholder={
              status === "running"
                ? "Agent is running..."
                : status === "waiting"
                ? "Reply to the question above..."
                : "Ask to make changes (e.g., make it dark mode)..."
            }
            value={updatePrompt}
            onChange={(e) => onUpdatePromptChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onUpdateSubmit(e);
              }
            }}
            disabled={status === "running" || status === "waiting"}
            className="w-full min-h-[50px] max-h-[120px] resize-none bg-transparent border-0 text-zinc-200 placeholder-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs p-2 focus:outline-none disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-2 pt-1 border-t border-white/5 mt-1">
            <span className="text-[10px] text-zinc-600 font-mono">Press Enter to send</span>
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
  );
}
