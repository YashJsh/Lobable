"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, FolderGit2, LogOut, User } from "lucide-react";
import Link from "next/link";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string | undefined;

  const { token, user, logout } = useAuthStore();
  const { projects, fetchProjects, clearActiveProject } = useProjectStore();

  useEffect(() => {    
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/signin");
      return;
    }
    
    if (token) {
      fetchProjects();
    }
  }, [token, fetchProjects, router]);

  const handleLogout = () => {
    logout();
    clearActiveProject();
    router.push("/signin");
  };

  const handleNewProject = () => {
    clearActiveProject();
    router.push("/");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      {/* Sidebar Panel */}
      <aside className="w-72 bg-zinc-950 border-r border-white/5 flex flex-col shrink-0 h-full relative z-20">
        {/* Top Header */}
        <div className="p-5 border-b border-white/5 space-y-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleNewProject}>
            <div className="size-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
              L
            </div>
            <div>
              <span className="font-sans font-light tracking-tight text-zinc-200">Lobable</span>
              <span className="text-[10px] font-mono text-zinc-500 block -mt-1">v1.0</span>
            </div>
          </div>

          <Button
            onClick={handleNewProject}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:border-white/20 text-zinc-200 py-5 rounded-xl text-xs font-mono transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            NEW PROJECT
          </Button>
        </div>

        {/* Previous Workspaces List */}
        <div className="flex-1 flex flex-col overflow-hidden py-4">
          <div className="px-5 mb-2 text-[10px] font-mono text-zinc-500 tracking-wider">
            PREVIOUS PROJECTS
          </div>
          
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1">
              {projects.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-600 font-mono">
                  No projects yet.
                </div>
              ) : (
                projects.map((p) => {
                  const isActive = p.id === projectId;
                  return (
                    <Link
                      key={p.id}
                      href={`/build/${p.id}`}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono transition-all group ${
                        isActive
                          ? "bg-zinc-900 text-zinc-100 border border-white/10"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 border border-transparent"
                      }`}
                    >
                      <FolderGit2 className={`size-4 transition-colors ${
                        isActive ? "text-white" : "text-zinc-700 group-hover:text-zinc-500"
                      }`} />
                      <span className="truncate flex-1 text-left">{p.name}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* User Footer Profile Panel */}
        {user && (
          <div className="p-4 border-t border-white/5 bg-zinc-950/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="size-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                <User className="size-4 text-zinc-500" />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs text-zinc-200 font-medium block truncate leading-none">
                  {user.name}
                </span>
                <span className="text-[10px] text-zinc-500 block truncate mt-1">
                  {user.email}
                </span>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              size="icon"
              variant="ghost"
              className="size-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/10 transition-all shrink-0 cursor-pointer"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </aside>

      {/* Main Viewport Panel */}
      <main className="flex-1 flex overflow-hidden relative bg-black z-10">
        {children}
      </main>
    </div>
  );
}
