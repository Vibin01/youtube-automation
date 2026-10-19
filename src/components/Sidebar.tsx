"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  Film,
  PlaySquare,
  UploadCloud,
  BarChart3,
  Clock,
  Settings,
  Sparkles,
  Bot,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Content Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Script Studio", href: "/scripts", icon: FileText },
  { name: "Video Studio", href: "/studio", icon: Film },
  { name: "Video Library", href: "/videos", icon: PlaySquare },
  { name: "Publishing", href: "/publishing", icon: UploadCloud },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Jobs & Logs", href: "/jobs", icon: Clock },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-between min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-white tracking-tight text-sm flex items-center gap-1.5">
              <span>AutoTube AI</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                v2
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Zero-Cost Automation</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/10 text-sky-400 border border-sky-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? "text-sky-400" : "text-slate-400"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 m-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300">Local Engine Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Gemini 2.5 • Edge-TTS • FFmpeg Core
        </p>
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Worker: Standby</span>
          <Bot className="h-3.5 w-3.5 text-sky-400" />
        </div>
      </div>
    </aside>
  );
}
