"use client";

import React, { useState } from "react";
import { RefreshCw, ExternalLink, Copy, Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewPanelProps {
  sandboxUrl: string | null;
  onReload: () => void;
}

export default function PreviewPanel({ sandboxUrl, onReload }: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    if (!sandboxUrl) return;
    navigator.clipboard.writeText(sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-black h-screen relative">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#050505]">
        <div className="flex items-center gap-4 flex-1">
          {/* URL Address Bar */}
          <div className="flex-1 max-w-xl flex items-center border border-white/10 rounded-lg bg-black px-3 py-1 text-xs text-zinc-400 font-mono select-none">
            <span className="text-zinc-700 mr-1 select-none">preview:</span>
            <span className="truncate flex-1">{sandboxUrl || "Loading environment..."}</span>
            {sandboxUrl && (
              <button
                onClick={handleCopyUrl}
                className="ml-2 hover:text-white transition-colors cursor-pointer"
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
            onClick={onReload}
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
  );
}
