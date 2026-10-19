"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Film,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  PlaySquare,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
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
    subscribers: number;
    videoCount: number;
  } | null;
  recentActivity: Array<{
    id: string;
    title: string;
    format: string;
    language: string;
    status: string;
    createdAt: string;
    renders: Array<{ outputPath?: string; durationSec?: number }>;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickNiche, setQuickNiche] = useState("Tech & AI");
  const [quickFormat, setQuickFormat] = useState<"SHORTS" | "LONG_FORM">("SHORTS");
  const [quickLang, setQuickLang] = useState<"English" | "Tamil">("English");
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickPipeline = async () => {
    try {
      setIsLaunching(true);
      setLaunchMessage("Initiating automated pipeline...");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowType: "FULL_PIPELINE",
          payload: {
            niche: quickNiche,
            format: quickFormat,
            language: quickLang,
          },
          runImmediately: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLaunchMessage("Pipeline launched! Redirecting to Jobs & Logs...");
        setTimeout(() => {
          window.location.href = "/jobs";
        }, 1200);
      } else {
        setLaunchMessage(`Error: ${json.error}`);
        setIsLaunching(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setLaunchMessage(`Launch failed: ${error.message}`);
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Autonomous Content Production</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              YouTube Content Automation Agent
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Generate viral video ideas, write full production scripts, synthesize neural voiceovers,
              and assemble 1080p Shorts & long-form videos with zero paid API costs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-3 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/ideas"
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-indigo-500 transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Explore Content Ideas</span>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Videos</span>
            <Film className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {loading ? "..." : data?.metrics.totalVideos ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            {data?.metrics.shortsCount ?? 0} Shorts • {data?.metrics.longFormCount ?? 0} Long-form
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 tracking-tight">
            {loading ? "..." : data?.metrics.inProgressVideos ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Rendering & Scripting</p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Published</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight">
            {loading ? "..." : data?.metrics.publishedVideos ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Live on YouTube</p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ideas Pool</span>
            <Lightbulb className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400 tracking-tight">
            {loading ? "..." : data?.metrics.totalIdeas ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Viral topics ready</p>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Launch Pipeline Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl glass-card space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sky-400">
              <TrendingUp className="h-4 w-4" />
              <h3 className="font-bold text-base text-white">1-Click Auto Pipeline</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Launch an autonomous end-to-end job that drafts an idea, writes the script, creates scenes,
              synthesizes narration, and renders the video.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Niche or Topic</label>
              <input
                type="text"
                value={quickNiche}
                onChange={(e) => setQuickNiche(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                placeholder="e.g. AI Tools, Productivity, Space"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Format</label>
                <select
                  value={quickFormat}
                  onChange={(e) => setQuickFormat(e.target.value as "SHORTS" | "LONG_FORM")}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="SHORTS">Shorts (9:16)</option>
                  <option value="LONG_FORM">Long-form (16:9)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Language</label>
                <select
                  value={quickLang}
                  onChange={(e) => setQuickLang(e.target.value as "English" | "Tamil")}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                </select>
              </div>
            </div>

            {launchMessage && (
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-xs text-sky-300">
                {launchMessage}
              </div>
            )}

            <button
              onClick={handleQuickPipeline}
              disabled={isLaunching}
              className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-sky-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isLaunching ? "Processing..." : "Launch Automation Pipeline"}</span>
            </button>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Film className="h-4 w-4 text-sky-400" />
              <span>Recent Video Projects</span>
            </h3>
            <Link
              href="/videos"
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
            >
              <span>View All Library</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading activity...</div>
          ) : !data?.recentActivity || data.recentActivity.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-slate-400">No video projects created yet.</p>
              <Link
                href="/ideas"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30"
              >
                <span>Generate Your First Video</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Title</th>
                    <th className="pb-3 font-semibold">Format</th>
                    <th className="pb-3 font-semibold">Language</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.recentActivity.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 pr-4 font-medium text-slate-200 max-w-xs truncate">
                        {project.title}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {project.format}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-400">{project.language}</td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            project.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : project.status === "RENDERED"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <Link
                          href={`/scripts?id=${project.id}`}
                          className="text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          Script
                        </Link>
                        <Link
                          href={`/studio?id=${project.id}`}
                          className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          Studio
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
