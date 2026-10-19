"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { YoutubeIcon } from "./YoutubeIcon";

interface ChannelData {
  title: string;
  thumbnailUrl?: string;
  subscriberCount: number;
}

export function Header() {
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/youtube/channel")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.connected) {
          setChannel(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/60 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <span>AI YouTube Automation Studio</span>
        </h1>
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <span>Gemini 2.5 Flash</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* YouTube Channel Status Badge */}
        <Link
          href="/publishing"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 transition-colors"
        >
          <YoutubeIcon className={`h-4 w-4 ${channel ? "text-rose-500" : "text-slate-500"}`} />
          {loading ? (
            <span className="text-slate-500">Checking...</span>
          ) : channel ? (
            <div className="flex items-center gap-1.5 text-slate-200">
              <span className="truncate max-w-[120px]">{channel.title}</span>
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <span>Connect Channel</span>
              <AlertCircle className="h-3 w-3 text-amber-400" />
            </div>
          )}
        </Link>

        {/* Quick Launch Button */}
        <Link
          href="/ideas"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>New Video Idea</span>
        </Link>
      </div>
    </header>
  );
}
