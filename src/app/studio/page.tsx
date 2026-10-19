"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Film,
  Play,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Volume2,
  Image as ImageIcon,
  ArrowRight,
  UploadCloud,
  RefreshCw,
} from "lucide-react";

interface Scene {
  id: string;
  orderIndex: number;
  narration: string;
  visualPrompt: string | null;
  captionText: string | null;
  duration: number;
  audioPath: string | null;
  imagePath: string | null;
}

interface RenderData {
  id: string;
  outputPath: string | null;
  thumbnailPath: string | null;
  durationSec: number;
  fileSizeBytes: number;
  status: string;
  progress: number;
}

interface ProjectData {
  id: string;
  title: string;
  format: "SHORTS" | "LONG_FORM";
  language: "English" | "Tamil";
  status: string;
  scenes: Scene[];
  renders: RenderData[];
}

function VideoStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialProjectId = searchParams.get("id");

  const [projects, setProjects] = useState<Array<{ id: string; title: string; format: string }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/scripts");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setProjects(json.data);
        if (!selectedProjectId) {
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

  const fetchProjectDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scripts/${id}`);
      const json = await res.json();
      if (json.success) {
        setProject(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleStartRender = async () => {
    if (!project) return;
    try {
      setRendering(true);
      setRenderProgress(10);
      setRenderStatus("Synthesizing neural voiceover with Edge-TTS...");

      const progressInterval = setInterval(() => {
        setRenderProgress((prev) => {
          if (prev >= 85) return prev;
          return prev + 15;
        });
      }, 2500);

      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoProjectId: project.id,
          aspectRatio: project.format === "SHORTS" ? "9:16" : "16:9",
        }),
      });

      clearInterval(progressInterval);
      const json = await res.json();

      if (json.success) {
        setRenderProgress(100);
        setRenderStatus("Rendering completed successfully!");
        fetchProjectDetails(project.id);
      } else {
        alert(json.error || "Rendering failed");
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Render error: ${error.message}`);
    } finally {
      setRendering(false);
    }
  };

  const latestRender = project?.renders?.[0];
  const videoStreamUrl = latestRender?.outputPath
    ? `/api/media/${latestRender.outputPath.replace(/\\/g, "/").split("output/").pop()}`
    : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Film className="h-6 w-6 text-sky-400" />
            <span>Video Studio & Render Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Preview scenes, configure narration, render 1080p video, and create thumbnails.
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-3">
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
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading studio project...</div>
      ) : !project ? (
        <div className="py-24 text-center glass-card rounded-3xl p-8 space-y-4">
          <Film className="h-12 w-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No Project Found</h4>
          <p className="text-xs text-slate-400">
            Please generate or select a script first before entering the video studio.
          </p>
          <Link
            href="/scripts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30"
          >
            Go to Script Studio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Video Preview Player or Render Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl glass-card space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Output Preview
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-sky-400">
                  {project.format === "SHORTS" ? "9:16 (1080x1920)" : "16:9 (1920x1080)"}
                </span>
              </div>

              {/* Video Player or Aspect Ratio placeholder */}
              <div
                className={`relative rounded-2xl overflow-hidden bg-black/90 border border-slate-800 flex items-center justify-center ${
                  project.format === "SHORTS" ? "aspect-[9/16] max-h-[500px] mx-auto" : "aspect-video"
                }`}
              >
                {latestRender && latestRender.status === "COMPLETED" && videoStreamUrl ? (
                  <video
                    src={videoStreamUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <Film className="h-12 w-12 text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-400">
                      {rendering ? "Rendering in progress..." : "Video not rendered yet"}
                    </p>
                  </div>
                )}
              </div>

              {/* Render Status and Progress */}
              {rendering && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{renderStatus}</span>
                    <span className="text-sky-400 font-bold">{renderProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Render Trigger & Publish Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleStartRender}
                  disabled={rendering}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-sky-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {rendering
                      ? "Rendering with FFmpeg..."
                      : latestRender?.status === "COMPLETED"
                      ? "Re-Render Video"
                      : "Render 1080p Video Now"}
                  </span>
                </button>

                {latestRender?.status === "COMPLETED" && (
                  <Link
                    href={`/publishing?id=${project.id}`}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload to YouTube</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Scenes & Assets Inspector */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-sky-400" />
                  <span>Production Scenes ({project.scenes.length})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Total Duration: ~
                  {Math.round(project.scenes.reduce((acc, s) => acc + s.duration, 0))}s
                </span>
              </div>

              <div className="space-y-4">
                {project.scenes.map((scene, idx) => (
                  <div
                    key={scene.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-200">Scene {idx + 1}</span>
                      </div>
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{scene.duration}s</span>
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <Volume2 className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 leading-relaxed font-medium">
                          &ldquo;{scene.narration}&rdquo;
                        </p>
                      </div>

                      {scene.visualPrompt && (
                        <div className="flex items-start gap-2 pt-1">
                          <ImageIcon className="h-3.5 w-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-400 leading-relaxed text-[11px]">
                            {scene.visualPrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoStudioPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-400 text-sm">Loading video studio...</div>}>
      <VideoStudioContent />
    </Suspense>
  );
}
