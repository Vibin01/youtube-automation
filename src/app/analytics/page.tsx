"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Film,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { YoutubeIcon } from "@/components/YoutubeIcon";

interface AnalyticsResponse {
  metrics: {
    totalVideos: number;
    publishedVideos: number;
    inProgressVideos: number;
    failedVideos: number;
    totalIdeas: number;
    totalRenders: number;
    shortsCount: number;
    longFormCount: number;
  };
  channel: {
    title: string;
    customUrl?: string;
    subscribers: number;
    videoCount: number;
    thumbnailUrl?: string;
  } | null;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total = data?.metrics.totalVideos || 0;
  const published = data?.metrics.publishedVideos || 0;
  const completionRate = total > 0 ? Math.round((published / total) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-sky-400" />
          <span>Analytics & Production Insights</span>
        </h2>
        <p className="text-xs text-slate-400">
          Track channel metrics, video throughput, and production performance.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading analytics...</div>
      ) : (
        <div className="space-y-8">
          {/* Channel Overview Card */}
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <YoutubeIcon className="h-4 w-4 text-rose-500" />
                <span>Connected YouTube Channel Metrics</span>
              </h3>
              {data?.channel ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Synced
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Not Connected
                </span>
              )}
            </div>

            {data?.channel ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Channel Name
                  </span>
                  <div className="text-lg font-bold text-white mt-1">{data.channel.title}</div>
                  <span className="text-[11px] text-slate-500">{data.channel.customUrl}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Subscribers
                  </span>
                  <div className="text-2xl font-bold text-sky-400 mt-1">
                    {data.channel.subscribers.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">Total Audience</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Total Videos
                  </span>
                  <div className="text-2xl font-bold text-purple-400 mt-1">
                    {data.channel.videoCount.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">Live Videos on YouTube</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                Connect your YouTube channel in the <strong>Publishing</strong> section to sync live
                channel metrics and analytics.
              </div>
            )}
          </div>

          {/* Production Engine Throughput */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl glass-card space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Completion Rate</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{completionRate}%</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Percentage of created video projects published to YouTube.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-card space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Shorts vs Long-form</span>
                <Film className="h-4 w-4 text-sky-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {data?.metrics.shortsCount ?? 0} : {data?.metrics.longFormCount ?? 0}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {data?.metrics.shortsCount ?? 0} Vertical Shorts (9:16) vs{" "}
                {data?.metrics.longFormCount ?? 0} Landscape (16:9).
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-card space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Total Renders Completed</span>
                <CheckCircle2 className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-purple-400">
                {data?.metrics.totalRenders ?? 0}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full 1080p MP4 files rendered with FFmpeg.
              </p>
            </div>
          </div>

          {/* YouTube Policy & Optimization Guidelines */}
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold">
              <Info className="h-4 w-4" />
              <span>YouTube Content Quality & Policy Guidelines</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Avoid Automated Spam</span>
                <p className="text-slate-400 text-[11px]">
                  Always keep human review enabled. Inspect scripts for factual accuracy and review
                  the rendered video before making it public.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-white block">COPPA & Kids Safety</span>
                <p className="text-slate-400 text-[11px]">
                  Never automatically classify every video as not made for kids. Explicitly verify the
                  audience for every topic.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
