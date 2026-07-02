"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw, ExternalLink, Copy, Check, Terminal,
  Monitor, Code, FileCode, Folder, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllFiles, getFileContent } from "@/api/client";
import { BuildStatus } from "./types";

interface PreviewPanelProps {
  sandboxUrl: string | null;
  status: BuildStatus;
  onReload: () => void;
}

export default function PreviewPanel({ sandboxUrl, status, onReload }: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const isCompleted = status === "completed";

  const handleCopyUrl = () => {
    if (!sandboxUrl) return;
    navigator.clipboard.writeText(sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch files when switching to Code tab
  useEffect(() => {
    if (activeTab === "code" && isCompleted && files.length === 0) {
      fetchFiles();
    }
  }, [activeTab, isCompleted]);

  // Reset tab when a new build starts
  useEffect(() => {
    if (!isCompleted) {
      setActiveTab("preview");
      setFiles([]);
      setSelectedFile(null);
      setFileContent(null);
    }
  }, [isCompleted]);

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await getAllFiles();
      if (res.success && res.data) {
        setFiles(res.data.filter((f: any) => f.type !== "dir"));
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    if (selectedFile === filePath) return;
    setSelectedFile(filePath);
    setLoadingContent(true);
    setFileContent(null);
    try {
      const res = await getFileContent(filePath);
      if (res.success && res.data !== undefined) {
        setFileContent(res.data);
      } else if (res.sucess && res.data !== undefined) {
        // backend typo fallback
        setFileContent(res.data);
      }
    } catch (err) {
      console.error("Error loading file content:", err);
      setFileContent("// Failed to load file content.");
    } finally {
      setLoadingContent(false);
    }
  };

  // ─── Building state ───────────────────────────────────────────────────────
  if (!isCompleted) {
    return (
      <div className="flex-1 flex flex-col bg-black h-screen relative">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#050505]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-600">preview</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider border border-white/5 px-2 py-1 rounded-full">
            {status === "waiting" ? "waiting for input" : "building"}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-black text-center px-8">
          <div className="relative">
            <div className="size-16 rounded-full border border-white/10 border-t-white animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Terminal className="size-5 text-zinc-400" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-100">
              {status === "waiting" ? "Waiting for your answer..." : "Building your application..."}
            </p>
            <p className="text-xs text-zinc-500 font-mono max-w-sm leading-relaxed">
              {status === "waiting"
                ? "Answer the question in the chat panel to continue."
                : "The AI is writing code. Preview will appear here once the build is complete."}
            </p>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 rounded-full bg-zinc-700 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Completed state ──────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-black h-screen relative min-h-0">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#050505] shrink-0">
        <div className="flex items-center gap-3 flex-1">
          {/* Tab toggle */}
          <div className="flex items-center border border-white/10 rounded-lg bg-black p-0.5 select-none shrink-0">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                activeTab === "preview" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Monitor className="size-3.5" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                activeTab === "code" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Code className="size-3.5" />
              Code
            </button>
          </div>

          {/* URL bar — only in preview tab */}
          {activeTab === "preview" && (
            <div className="flex-1 max-w-xl flex items-center border border-white/10 rounded-lg bg-black px-3 py-1 text-xs text-zinc-400 font-mono select-none">
              <span className="text-zinc-700 mr-1 select-none">preview:</span>
              <span className="truncate flex-1">{sandboxUrl || "Loading sandbox..."}</span>
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
          )}
        </div>

        {/* Browser controls — only in preview tab */}
        {activeTab === "preview" && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="icon"
              className="size-8 rounded-lg hover:bg-zinc-900 hover:text-white"
              onClick={onReload}
              disabled={!sandboxUrl}
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="size-8 rounded-lg hover:bg-zinc-900 hover:text-white"
              onClick={() => sandboxUrl && window.open(sandboxUrl, "_blank")}
              disabled={!sandboxUrl}
            >
              <ExternalLink className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Viewport */}
      <div className="flex-1 min-h-0 bg-black flex items-stretch">
        {activeTab === "preview" ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="h-full w-full border border-white/10 rounded-xl overflow-hidden bg-zinc-950 shadow-2xl">
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
                    <p className="text-sm font-medium text-zinc-100">Sandbox Starting</p>
                    <p className="text-xs text-zinc-500 font-mono max-w-sm leading-relaxed">
                      Connecting to the sandbox environment...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Code explorer */
          <div className="flex flex-1 min-h-0">
            {/* File tree */}
            <div className="w-[240px] border-r border-white/10 flex flex-col bg-black/40 shrink-0">
              <div className="p-3 border-b border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 font-semibold select-none">
                <Folder className="size-3.5 text-zinc-400" />
                Workspace Files
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-2 space-y-0.5">
                  {loadingFiles ? (
                    <div className="p-4 flex items-center justify-center text-zinc-600 text-xs font-mono gap-2">
                      <Loader2 className="size-3.5 animate-spin" />
                      Fetching files...
                    </div>
                  ) : files.length === 0 ? (
                    <div className="p-4 text-zinc-600 text-xs font-mono text-center">
                      No files found.
                    </div>
                  ) : (
                    files.map((file) => {
                      const relativePath = file.path
                        .replace("/home/user/next-app/", "")
                        .replace("/home/user/react-app/", "");
                      const isSelected = selectedFile === file.path;
                      return (
                        <button
                          key={file.path}
                          onClick={() => handleFileSelect(file.path)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white text-black font-medium"
                              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                          }`}
                        >
                          <FileCode className={`size-3.5 shrink-0 ${isSelected ? "text-black" : "text-zinc-500"}`} />
                          <span className="truncate">{relativePath}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Code viewer */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#030303]">
              {selectedFile ? (
                <>
                  <div className="p-3 border-b border-white/10 bg-black/40 text-xs font-mono text-zinc-500 flex items-center justify-between shrink-0">
                    <span className="truncate">
                      {selectedFile
                        .replace("/home/user/next-app/", "")
                        .replace("/home/user/react-app/", "")}
                    </span>
                    {loadingContent && <Loader2 className="size-3.5 animate-spin text-zinc-400" />}
                  </div>
                  <ScrollArea className="flex-1 min-h-0 bg-[#020202]">
                    <div className="py-4">
                      {loadingContent ? (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-600 text-xs font-mono gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Loading...
                        </div>
                      ) : fileContent !== null ? (
                        fileContent.trim() === "" ? (
                          <div className="text-zinc-600 text-xs font-mono p-4 text-center">Empty file</div>
                        ) : (
                          <div className="select-text">
                            {fileContent.split("\n").map((line, idx) => (
                              <div key={idx} className="flex hover:bg-zinc-900/40 px-4 py-0.5 leading-relaxed group">
                                <span className="w-8 text-zinc-600 font-mono text-[10px] select-none text-right pr-4 shrink-0 border-r border-white/5 mr-4 group-hover:text-zinc-400">
                                  {idx + 1}
                                </span>
                                <span className="text-zinc-300 font-mono text-xs whitespace-pre select-text">
                                  {line}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      ) : null}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-600 bg-[#020202]">
                  <FileCode className="size-8 text-zinc-800 mb-2" />
                  <p className="text-xs font-mono">Select a file to view its contents.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
