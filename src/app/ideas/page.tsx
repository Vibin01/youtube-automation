"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lightbulb,
  Sparkles,
  Filter,
  Check,
  Bookmark,
  Trash2,
  ArrowRight,
  Clock,
  Layers,
  Globe,
} from "lucide-react";

interface Idea {
  id: string;
  title: string;
  hook?: string;
  description?: string;
  targetAudience?: string;
  niche: string;
  format: "SHORTS" | "LONG_FORM";
  language: "English" | "Tamil";
  category: string;
  status: "GENERATED" | "SAVED" | "APPROVED" | "REJECTED" | "USED";
  estimatedDuration: number;
  tags?: string;
  createdAt: string;
}

export default function IdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form State
  const [niche, setNiche] = useState("Tech & AI Productivity");
  const [category, setCategory] = useState<"educational" | "entertainment" | "storytelling" | "kids">("educational");
  const [format, setFormat] = useState<"SHORTS" | "LONG_FORM">("SHORTS");
  const [language, setLanguage] = useState<"English" | "Tamil">("English");
  const [tone, setTone] = useState("Engaging & Punchy");
  const [count, setCount] = useState(3);

  // Filter State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formatFilter, setFormatFilter] = useState("ALL");
  const [langFilter, setLangFilter] = useState("ALL");

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== "ALL") query.append("status", statusFilter);
      if (formatFilter !== "ALL") query.append("format", formatFilter);
      if (langFilter !== "ALL") query.append("language", langFilter);

      const res = await fetch(`/api/ideas?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setIdeas(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [statusFilter, formatFilter, langFilter]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          category,
          format,
          language,
          tone,
          count,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchIdeas();
      } else {
        alert(json.error || "Failed to generate ideas");
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Generation failed: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === id ? { ...idea, status: newStatus as any } : idea))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    try {
      await fetch(`/api/ideas/${id}`, { method: "DELETE" });
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateScript = async (idea: Idea) => {
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea.title,
          hook: idea.hook,
          niche: idea.niche,
          format: idea.format,
          language: idea.language,
          targetDurationSec: idea.estimatedDuration,
          category: idea.category,
          contentIdeaId: idea.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/scripts?id=${json.data.id}`);
      } else {
        alert(json.error || "Failed to create script");
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error creating script: ${error.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-400" />
            <span>Content Ideas Studio</span>
          </h2>
          <p className="text-xs text-slate-400">
            Generate high-CTR YouTube topics, research hooks, and convert ideas into scripts.
          </p>
        </div>
      </div>

      {/* Generation Form Card */}
      <form onSubmit={handleGenerate} className="p-6 rounded-3xl glass-card space-y-6">
        <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold">
          <Sparkles className="h-4 w-4" />
          <span>Gemini AI Idea Generator</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Niche or Subject
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              placeholder="e.g. Future AI Tools, Python Hacks, Tamil Cinema Mysteries"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Content Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="educational">Educational & Tips</option>
              <option value="entertainment">Entertainment & Viral</option>
              <option value="storytelling">Storytelling & Facts</option>
              <option value="kids">Kids & Family Safe</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="SHORTS">Shorts (9:16 Vertical)</option>
              <option value="LONG_FORM">Long-form (16:9)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tone</label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
              placeholder="e.g. High Energy, Mysterious"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Count</label>
            <select
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="3">3 Ideas</option>
              <option value="5">5 Ideas</option>
              <option value="8">8 Ideas</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={generating}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generating ? "Brainstorming with Gemini..." : "Generate Ideas"}</span>
          </button>
        </div>
      </form>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="GENERATED">Generated</option>
            <option value="SAVED">Saved</option>
            <option value="APPROVED">Approved</option>
            <option value="USED">Used</option>
          </select>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Formats</option>
            <option value="SHORTS">Shorts</option>
            <option value="LONG_FORM">Long-form</option>
          </select>

          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Languages</option>
            <option value="English">English</option>
            <option value="Tamil">Tamil</option>
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading ideas...</div>
      ) : ideas.length === 0 ? (
        <div className="py-20 text-center space-y-3 glass-card rounded-3xl p-8">
          <Lightbulb className="h-10 w-10 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No ideas match your filter</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Use the form above to generate fresh ideas with Gemini, or clear your active filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => {
            const tags: string[] = idea.tags ? JSON.parse(idea.tags) : [];

            return (
              <div
                key={idea.id}
                className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {idea.format}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>{idea.language}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white leading-snug">{idea.title}</h3>

                  {idea.hook && (
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-amber-300 leading-relaxed">
                      <span className="font-semibold text-slate-400 block text-[10px] uppercase">
                        Opening Hook
                      </span>
                      &ldquo;{idea.hook}&rdquo;
                    </div>
                  )}

                  {idea.description && (
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {idea.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>~{idea.estimatedDuration}s</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3 text-slate-500" />
                      <span>{idea.category}</span>
                    </span>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        handleStatusChange(
                          idea.id,
                          idea.status === "SAVED" ? "GENERATED" : "SAVED"
                        )
                      }
                      title="Bookmark Idea"
                      className={`p-2 rounded-lg border transition-colors ${
                        idea.status === "SAVED"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      title="Delete"
                      className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleCreateScript(idea)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-all active:scale-95"
                  >
                    <span>Write Script</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
