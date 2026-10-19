"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Film,
  Plus,
  Save,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
  Trash2,
} from "lucide-react";

interface Scene {
  id: string;
  orderIndex: number;
  narration: string;
  visualPrompt: string | null;
  captionText: string | null;
  duration: number;
}

interface ScriptData {
  id: string;
  title: string;
  hook: string | null;
  body: string;
  callToAction: string | null;
  description: string | null;
  hashtags: string | null;
  thumbnailIdeas: string | null;
  targetDurationSec: number;
  isApproved: boolean;
}

interface ProjectData {
  id: string;
  title: string;
  format: "SHORTS" | "LONG_FORM";
  language: "English" | "Tamil";
  madeForKids: boolean;
  humanApproved: boolean;
  script: ScriptData | null;
  scenes: Scene[];
}

function ScriptStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialProjectId = searchParams.get("id");

  const [projects, setProjects] = useState<Array<{ id: string; title: string; format: string }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quick Generate Modal / Form State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genTitle, setGenTitle] = useState("");
  const [genFormat, setGenFormat] = useState<"SHORTS" | "LONG_FORM">("SHORTS");
  const [genLanguage, setGenLanguage] = useState<"English" | "Tamil">("English");
  const [genDuration, setGenDuration] = useState(60);
  const [generating, setGenerating] = useState(false);

  // Fetch all projects list
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/scripts");
      const json = await res.json();
      if (json.success) {
        setProjects(json.data);
        if (!selectedProjectId && json.data.length > 0) {
          setSelectedProjectId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch selected project details
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetch(`/api/scripts/${selectedProjectId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProject(json.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  const handleSaveScript = async () => {
    if (!project) return;
    try {
      setSaving(true);
      await fetch(`/api/scripts/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          body: project.script?.body,
          hook: project.script?.hook,
          callToAction: project.script?.callToAction,
          description: project.script?.description,
          madeForKids: project.madeForKids,
          humanApproved: project.humanApproved,
          isApproved: project.script?.isApproved,
        }),
      });

      // Save each scene
      for (const scene of project.scenes) {
        await fetch(`/api/scenes/${scene.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            narration: scene.narration,
            visualPrompt: scene.visualPrompt,
            captionText: scene.captionText,
            duration: scene.duration,
          }),
        });
      }

      alert("Script and scenes saved successfully!");
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!project) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/scripts/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          humanApproved: true,
          isApproved: true,
          status: "SCENES_READY",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setProject(json.data);
        alert("Script approved! You can now proceed to Video Studio.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Approval failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: genTitle,
          format: genFormat,
          language: genLanguage,
          targetDurationSec: genDuration,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowGenerateModal(false);
        setGenTitle("");
        fetchProjects();
        setSelectedProjectId(json.data.id);
      } else {
        alert(json.error || "Generation failed");
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Project Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-sky-400" />
            <span>Script Studio</span>
          </h2>
          <p className="text-xs text-slate-400">
            Write, review, break down scenes, and approve scripts for video rendering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500 max-w-xs truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.format}] {p.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Script</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading script package...</div>
      ) : !project ? (
        <div className="py-24 text-center glass-card rounded-3xl p-8 space-y-4">
          <FileText className="h-12 w-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No Script Selected</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose an existing project from the selector or generate a new AI script package.
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30"
          >
            Create New Script
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Script Editor & Metadata */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Hook Card */}
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {project.format} • {project.language}
                </span>
                <div className="flex items-center gap-2">
                  {project.humanApproved || project.script?.isApproved ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approved</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Video Title
                </label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => setProject({ ...project, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Opening Hook (First 3 Seconds)
                </label>
                <input
                  type="text"
                  value={project.script?.hook || ""}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      script: project.script ? { ...project.script, hook: e.target.value } : null,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Narration Body
                </label>
                <textarea
                  rows={6}
                  value={project.script?.body || ""}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      script: project.script ? { ...project.script, body: e.target.value } : null,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Call to Action (CTA)
                </label>
                <input
                  type="text"
                  value={project.script?.callToAction || ""}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      script: project.script
                        ? { ...project.script, callToAction: e.target.value }
                        : null,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SEO Description
                </label>
                <textarea
                  rows={4}
                  value={project.script?.description || ""}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      script: project.script
                        ? { ...project.script, description: e.target.value }
                        : null,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Scene-by-Scene Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Film className="h-4 w-4 text-sky-400" />
                  <span>Scene Breakdown ({project.scenes.length} Scenes)</span>
                </h3>
              </div>

              <div className="space-y-3">
                {project.scenes.map((scene, idx) => (
                  <div key={scene.id} className="p-4 rounded-2xl glass-card space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-sky-400">Scene {idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{scene.duration}s</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Voiceover Narration
                        </label>
                        <textarea
                          rows={3}
                          value={scene.narration}
                          onChange={(e) => {
                            const newScenes = [...project.scenes];
                            newScenes[idx].narration = e.target.value;
                            setProject({ ...project, scenes: newScenes });
                          }}
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Visual Instructions / Card Text
                        </label>
                        <textarea
                          rows={3}
                          value={scene.visualPrompt || ""}
                          onChange={(e) => {
                            const newScenes = [...project.scenes];
                            newScenes[idx].visualPrompt = e.target.value;
                            setProject({ ...project, scenes: newScenes });
                          }}
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Policy Check, Approval, Actions */}
          <div className="space-y-6">
            {/* Policy & Safety Checks Card */}
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>YouTube Policy & Safety</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirm compliance with YouTube guidelines before rendering or publishing.
              </p>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.madeForKids}
                    onChange={(e) =>
                      setProject({ ...project, madeForKids: e.target.checked })
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 block">
                      Made for Kids (COPPA)
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Check if this video is explicitly aimed at children.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.humanApproved}
                    onChange={(e) =>
                      setProject({ ...project, humanApproved: e.target.checked })
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 block">
                      Human Review Confirmed
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Verified script is original, non-misleading, and policy compliant.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions Card */}
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Workflow Actions
              </h4>

              <button
                onClick={handleSaveScript}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? "Saving..." : "Save Draft"}</span>
              </button>

              <button
                onClick={handleApprove}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve Script</span>
              </button>

              <button
                onClick={() => router.push(`/studio?id=${project.id}`)}
                className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Video Studio</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Script Generator */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl glass-card bg-slate-950 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-400" />
                <span>Generate New Script Package</span>
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateScript} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Topic or Title
                </label>
                <input
                  type="text"
                  required
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="e.g. 5 Secret AI Websites That Feel Illegal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Format</label>
                  <select
                    value={genFormat}
                    onChange={(e) => setGenFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  >
                    <option value="SHORTS">Shorts (9:16)</option>
                    <option value="LONG_FORM">Long-form (16:9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Language
                  </label>
                  <select
                    value={genLanguage}
                    onChange={(e) => setGenLanguage(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  >
                    <option value="English">English</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Duration: {genDuration} seconds
                </label>
                <input
                  type="range"
                  min="30"
                  max={genFormat === "SHORTS" ? 60 : 600}
                  step="10"
                  value={genDuration}
                  onChange={(e) => setGenDuration(parseInt(e.target.value, 10))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Script"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScriptStudioPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-400 text-sm">Loading script studio...</div>}>
      <ScriptStudioContent />
    </Suspense>
  );
}
