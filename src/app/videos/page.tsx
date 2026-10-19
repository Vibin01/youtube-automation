"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlaySquare,
  Search,
  Play,
  Film,
  UploadCloud,
  Clock,
  HardDrive,
  Calendar,
  X,
  ExternalLink,
} from "lucide-react";

interface RenderItem {
  id: string;
  outputPath: string | null;
  thumbnailPath: string | null;
  resolution: string;
  aspectRatio: string;
  durationSec: number;
  fileSizeBytes: number;
  status: string;
  createdAt: string;
  videoProject: {
    id: string;
    title: string;
    format: string;
    language: string;
    status: string;
  };
}

export default function VideoLibraryPage() {
  const [renders, setRenders] = useState<RenderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState("ALL");
  const [activePreview, setActivePreview] = useState<RenderItem | null>(null);

  const fetchRenders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/render");
      const json = await res.json();
      if (json.success) {
        setRenders(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenders();
  }, []);

  const filteredRenders = renders.filter((item) => {
    const matchesSearch = item.videoProject.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFormat =
      formatFilter === "ALL" || item.videoProject.format === formatFilter;
    return matchesSearch && matchesFormat;
  });

  const getMediaUrl = (absPath: string | null) => {
    if (!absPath) return "";
    const clean = absPath.replace(/\\/g, "/");
    const relative = clean.split("output/").pop();
    return `/api/media/${relative}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PlaySquare className="h-6 w-6 text-sky-400" />
            <span>Video Library</span>
          </h2>
          <p className="text-xs text-slate-400">
            Browse, preview, and manage your rendered YouTube videos and thumbnails.
          </p>
        </div>

        <Link
          href="/studio"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md hover:opacity-90"
        >
          <Film className="h-3.5 w-3.5" />
          <span>Go to Video Studio</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center py-3 px-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos by title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Formats</option>
            <option value="SHORTS">Shorts (9:16)</option>
            <option value="LONG_FORM">Long-form (16:9)</option>
          </select>
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading video library...</div>
      ) : filteredRenders.length === 0 ? (
        <div className="py-24 text-center glass-card rounded-3xl p-8 space-y-4">
          <Film className="h-12 w-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No Rendered Videos Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Render your first video in Video Studio to see it appear in your library.
          </p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30"
          >
            Render a Video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRenders.map((render) => {
            const isShorts = render.videoProject.format === "SHORTS";
            const thumbUrl = getMediaUrl(render.thumbnailPath);
            const videoUrl = getMediaUrl(render.outputPath);
            const fileSizeMb = (render.fileSizeBytes / (1024 * 1024)).toFixed(1);

            return (
              <div
                key={render.id}
                className="rounded-3xl overflow-hidden glass-card flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail / Poster Box */}
                  <div className="relative aspect-video bg-black/80 flex items-center justify-center overflow-hidden group">
                    {render.thumbnailPath ? (
                      <img
                        src={thumbUrl}
                        alt={render.videoProject.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Film className="h-10 w-10 text-slate-700" />
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => setActivePreview(render)}
                        className="p-3 rounded-full bg-sky-500 text-white shadow-lg hover:scale-110 transition-transform"
                        title="Play Video"
                      >
                        <Play className="h-5 w-5 fill-white" />
                      </button>
                    </div>

                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-sm text-sky-400 border border-sky-500/30">
                      {render.videoProject.format}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 text-white flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{Math.round(render.durationSec)}s</span>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                      {render.videoProject.title}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                        <span>{fileSizeMb} MB</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-300">{render.resolution}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActivePreview(render)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Play className="h-3 w-3" />
                    <span>Watch</span>
                  </button>

                  <Link
                    href={`/publishing?id=${render.videoProject.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                  >
                    <UploadCloud className="h-3 w-3" />
                    <span>Publish</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Modal Player */}
      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl rounded-3xl glass-card bg-slate-950 border border-slate-800 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white truncate max-w-xl">
                {activePreview.videoProject.title}
              </h3>
              <button
                onClick={() => setActivePreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className={`rounded-2xl overflow-hidden bg-black flex items-center justify-center ${
                activePreview.videoProject.format === "SHORTS"
                  ? "aspect-[9/16] max-h-[550px] mx-auto"
                  : "aspect-video"
              }`}
            >
              <video
                src={getMediaUrl(activePreview.outputPath)}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Duration: {Math.round(activePreview.durationSec)} seconds</span>
              <a
                href={getMediaUrl(activePreview.outputPath)}
                download
                className="text-sky-400 hover:underline"
              >
                Download MP4
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
