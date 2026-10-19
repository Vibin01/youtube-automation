"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ExternalLink,
  Lock,
  Globe,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { YoutubeIcon } from "@/components/YoutubeIcon";

interface ChannelInfo {
  id: string;
  channelId: string;
  title: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  videoCount: number;
}

interface ProjectOption {
  id: string;
  title: string;
  format: string;
  description?: string;
  tags?: string;
  renders: Array<{ id: string; status: string; outputPath?: string }>;
}

function PublishingContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("id");
  const connectedQuery = searchParams.get("connected");
  const errorQuery = searchParams.get("error");

  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [loadingChannel, setLoadingChannel] = useState(true);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState<"private" | "unlisted" | "public">("private");
  const [scheduledTime, setScheduledTime] = useState("");
  const [madeForKids, setMadeForKids] = useState(false);
  const [humanApproved, setHumanApproved] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState(errorQuery || "");

  const fetchChannel = async () => {
    try {
      setLoadingChannel(true);
      const res = await fetch("/api/youtube/channel");
      const json = await res.json();
      if (json.success && json.connected) {
        setChannel(json.data);
      } else {
        setChannel(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChannel(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/scripts");
      const json = await res.json();
      if (json.success) {
        // filter projects that have rendered videos
        const rendered = json.data.filter(
          (p: ProjectOption) => p.renders && p.renders.some((r) => r.status === "COMPLETED")
        );
        setProjects(rendered);

        const target = rendered.find((p: ProjectOption) => p.id === (initialProjectId || selectedProjectId)) || rendered[0];
        if (target) {
          setSelectedProjectId(target.id);
          setTitle(target.title);
          setDescription(target.description || "");
          if (target.tags) {
            try {
              const parsed = JSON.parse(target.tags);
              setTagsInput(Array.isArray(parsed) ? parsed.join(", ") : "");
            } catch {
              setTagsInput("");
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChannel();
    fetchProjects();
  }, []);

  const handleConnect = async () => {
    try {
      const res = await fetch("/api/youtube/auth");
      const json = await res.json();
      if (json.success && json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error || "Failed to initiate Google OAuth");
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`OAuth error: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your YouTube channel?")) return;
    try {
      await fetch("/api/youtube/channel", { method: "DELETE" });
      setChannel(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!humanApproved) {
      alert("Please confirm human review before publishing to YouTube.");
      return;
    }

    try {
      setUploading(true);
      setErrorMessage("");
      setUploadedVideoUrl(null);
      setUploadProgress(20);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? prev : prev + 15));
      }, 1500);

      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const res = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoProjectId: selectedProjectId,
          title,
          description,
          tags: tagsArray,
          privacyStatus,
          scheduledPublishTime: scheduledTime ? new Date(scheduledTime).toISOString() : null,
          madeForKids,
          humanApproved,
        }),
      });

      clearInterval(progressInterval);
      const json = await res.json();

      if (json.success) {
        setUploadProgress(100);
        setUploadedVideoUrl(json.data.videoUrl);
      } else {
        setErrorMessage(json.error || "YouTube upload failed.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to connect to upload endpoint.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-sky-400" />
          <span>YouTube Publishing & Channel Integration</span>
        </h2>
        <p className="text-xs text-slate-400">
          Connect your YouTube account, review metadata, verify COPPA/Kids settings, and publish.
        </p>
      </div>

      {/* Notifications / Alerts */}
      {connectedQuery && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>YouTube channel connected successfully via Google OAuth 2.0!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Channel Connection Status Card */}
      <div className="p-6 rounded-3xl glass-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <YoutubeIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">YouTube Channel Status</h3>
              <p className="text-xs text-slate-400">Google OAuth 2.0 Integration</p>
            </div>
          </div>

          {channel ? (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 transition-all"
            >
              <YoutubeIcon className="h-4 w-4" />
              <span>Connect Channel with Google</span>
            </button>
          )}
        </div>

        {loadingChannel ? (
          <div className="text-xs text-slate-400 py-2">Checking channel connection...</div>
        ) : channel ? (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {channel.thumbnailUrl && (
                <img
                  src={channel.thumbnailUrl}
                  alt={channel.title}
                  className="h-10 w-10 rounded-full border border-slate-700"
                />
              )}
              <div>
                <span className="font-bold text-sm text-white block">{channel.title}</span>
                <span className="text-[11px] text-slate-400">
                  {channel.customUrl || channel.channelId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="font-bold text-slate-200 block">
                  {channel.subscriberCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">Subscribers</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-200 block">
                  {channel.videoCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">Videos</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
            No channel connected yet. Click <strong>Connect Channel with Google</strong> above. Make
            sure you have added your Google Client ID and Secret in your <code>.env.local</code> or
            Settings.
          </div>
        )}
      </div>

      {/* Upload Success Banner */}
      {uploadedVideoUrl && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5" />
            <span>Video Successfully Uploaded to YouTube!</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your video was uploaded in <strong>{privacyStatus.toUpperCase()}</strong> mode. You can
            review and publish it live from YouTube Studio.
          </p>
          <a
            href={uploadedVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 shadow-md hover:bg-emerald-400 transition-all"
          >
            <span>Open Video on YouTube</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="p-6 rounded-3xl glass-card space-y-6">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-sky-400" />
          <span>Publish Video</span>
        </h3>

        {/* Project Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select Rendered Video Project
          </label>
          {projects.length === 0 ? (
            <div className="text-xs text-slate-400 p-3 rounded-xl bg-slate-900 border border-slate-800">
              No rendered videos found. Go to <strong>Video Studio</strong> to render a project
              first.
            </div>
          ) : (
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                const p = projects.find((item) => item.id === e.target.value);
                if (p) {
                  setTitle(p.title);
                  setDescription(p.description || "");
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.format}] {p.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300">YouTube Title</label>
            <span className="text-[10px] text-slate-400">{title.length}/100</span>
          </div>
          <input
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <span className="text-[10px] text-slate-400">{description.length}/5000</span>
          </div>
          <textarea
            rows={5}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="ai, tech, shorts, productivity, tamil"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Visibility & Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Privacy Visibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrivacyStatus("private")}
                className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  privacyStatus === "private"
                    ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                    : "border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Lock className="h-3 w-3" />
                <span>Private</span>
              </button>

              <button
                type="button"
                onClick={() => setPrivacyStatus("unlisted")}
                className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  privacyStatus === "unlisted"
                    ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                    : "border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <EyeOff className="h-3 w-3" />
                <span>Unlisted</span>
              </button>

              <button
                type="button"
                onClick={() => setPrivacyStatus("public")}
                className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  privacyStatus === "public"
                    ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                    : "border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Globe className="h-3 w-3" />
                <span>Public</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Schedule Publication (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Mandatory Policy & Review Checklist */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <ShieldAlert className="h-4 w-4" />
            <span>Mandatory Policy & Compliance Checklist</span>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={madeForKids}
              onChange={(e) => setMadeForKids(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">
                This video is Made for Kids (COPPA)
              </span>
              <span className="text-slate-400 text-[11px]">
                Never automatically declare all videos as not made for kids. Verify your audience.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={humanApproved}
              onChange={(e) => setHumanApproved(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">
                I have reviewed this content and confirm compliance with YouTube Community
                Guidelines *
              </span>
              <span className="text-slate-400 text-[11px]">
                Ensures content has no copyright infringement, misleading claims, or automated spam.
              </span>
            </div>
          </label>
        </div>

        {uploading && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Uploading video to YouTube...</span>
              <span className="text-sky-400 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !channel || projects.length === 0}
          className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-sky-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <UploadCloud className="h-4 w-4" />
          <span>{uploading ? "Uploading to YouTube..." : "Publish Video to YouTube"}</span>
        </button>
      </form>
    </div>
  );
}

export default function PublishingPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-400 text-sm">Loading publishing studio...</div>}>
      <PublishingContent />
    </Suspense>
  );
}
