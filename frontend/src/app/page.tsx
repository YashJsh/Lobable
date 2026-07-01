"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Generate a random project ID
    const projectId = Math.random().toString(36).substring(2, 15);
    
    // Save prompt to sessionStorage to keep the URL clean
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`prompt-${projectId}`, prompt.trim());
    }
    router.push(`/build/${projectId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-4 selection:bg-white selection:text-black">
      {/* Background patterns: ultra-minimalist grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f0f_1px,transparent_1px),linear-gradient(to_bottom,#0f0f0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-8">
        {/* Logo or Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 border border-white/10 px-3 py-1 rounded-full text-xs font-mono tracking-widest text-zinc-500 bg-zinc-950/50 backdrop-blur-sm">
            LOBABLE v1.0
          </div>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight font-sans text-zinc-100">
            What do you want to build?
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base font-light font-sans max-w-md mx-auto">
            Describe the interface or system you want to generate in detail.
          </p>
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="w-full relative group">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50 backdrop-blur-md transition-all duration-300 focus-within:border-white/30 focus-within:shadow-[0_0_30px_rgba(255,255,255,0.02)] p-2">
            <Textarea
              placeholder="e.g., Build a minimalist markdown note-taking app with instant saving, customizable tags, and a clean preview pane..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full min-h-[120px] max-h-[300px] resize-none bg-transparent border-0 text-zinc-200 placeholder-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed p-3 focus:outline-none"
            />
            
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/5 mt-2">
              <span className="text-[11px] text-zinc-600 font-mono">
                Press Enter to generate, Shift+Enter for new line
              </span>
              <Button
                type="submit"
                disabled={!prompt.trim()}
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg bg-white text-black hover:bg-zinc-200 hover:text-black disabled:bg-zinc-900 disabled:text-zinc-600 transition-all duration-200 shrink-0"
              >
                <ArrowUp className="size-4 stroke-[2.5]" />
              </Button>
            </div>
          </div>
        </form>

        {/* Quick suggestions */}
        <div className="flex flex-wrap justify-center gap-2 text-xs font-mono text-zinc-500">
          {[
            "Interactive Dashboard",
            "Markdown Editor",
            "Kanban Board",
            "Audio Synthesizer",
          ].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setPrompt(`Build a modern, highly interactive ${tag.toLowerCase()} that includes...`)}
              className="border border-white/5 bg-zinc-950/30 hover:bg-zinc-900/60 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
