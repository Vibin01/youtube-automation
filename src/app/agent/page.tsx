"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Sparkles,
  Play,
  Film,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Layers,
  Tv,
  ExternalLink,
  Download,
  Calendar,
  Clock,
  Sun,
  Moon,
  Repeat,
  Send,
  Users,
} from "lucide-react";
import { CAST } from "@/lib/characters/cast";

interface ShortItem {
  partNumber: number;
  title: string;
  outputPath: string;
  thumbnailPath: string;
  durationSec: number;
  scheduledTime: string;
  slot: "MORNING" | "EVENING";
  status: "PUBLISHED" | "SCHEDULED" | "QUEUED";
  youtubeUrl?: string;
  youtubeVideoId?: string;
}

export default function AgentPage() {
  // Main Studio Mode: "omni-story" (5-6 min + 8-10 shorts), "gemini-flash-lite-bridge", or "quick-agent"
  const [studioMode, setStudioMode] = useState<"omni-story" | "gemini-flash-lite-bridge" | "quick-agent">("omni-story");
  const [bridgeChar, setBridgeChar] = useState("anand");
  const [bridgePrompt, setBridgePrompt] = useState(
    "The 3D cartoon character in the image comes to life, speaking excitedly, laughing, doing energetic funny comic dance steps, fluid 3D animated movements, vibrant lighting"
  );
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [uploadedBridgeVideo, setUploadedBridgeVideo] = useState<string | null>(null);

  // Omni Story Studio State
  const [omniPrompt, setOmniPrompt] = useState(
    "ஆனந்தின் அதிநவீன AI ரோபோ டீக்கடை vs சோடா மணி பழங்கால டீக்கடை! ஊரே திரண்ட கலாட்டா!"
  );
  const [selectedChars, setSelectedChars] = useState<string[]>(["anand", "sodamani", "balu"]);
  const [sceneCount, setSceneCount] = useState<number>(8);
  const [autoPublish, setAutoPublish] = useState(true);
  const [publishFirstPartNow, setPublishFirstPartNow] = useState(true);
  const [privacyStatus, setPrivacyStatus] = useState<"public" | "unlisted" | "private">("unlisted");

  // Quick Single Agent State
  const [quickTopic, setQuickTopic] = useState("அலப்பறை ஆறுமுகம் 500 கோடி இன்டர்நேஷனல் டீல்! 🤣🔥");
  const [quickFormat, setQuickFormat] = useState<"SHORTS" | "LONG_FORM">("SHORTS");

  // Execution & Progress State
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [omniResult, setOmniResult] = useState<any>(null);
  const [quickResult, setQuickResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Short Publishing State (per part)
  const [publishingPart, setPublishingPart] = useState<number | null>(null);

  // API Key modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [replicateToken, setReplicateToken] = useState("");
  const [lumaToken, setLumaToken] = useState("");
  const [savingKeys, setSavingKeys] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState("");

  const omniSteps = [
    { id: 1, name: "Gemini Omni Screenplay", desc: `Generate ${sceneCount} connected comedic scenes` },
    { id: 2, name: "3D Animation Video Synthesis", desc: "100% animated video clips with multi-angle turnarounds (No static images)" },
    { id: 3, name: "5-6 Min Master Episode Joiner", desc: "Merge all scenes into continuous full animated story" },
    { id: 4, name: "Episodic 30s Shorts Slicing", desc: `Slice ${sceneCount} standalone vertical (9:16) Shorts` },
    { id: 5, name: "Morning & Evening Scheduler", desc: "Queue repeating daily slots: ☀️ Morning & 🌙 Evening" },
  ];

  const comedyStoryIdeas = [
    "ஆனந்தின் அதிநவீன AI ரோபோ டீக்கடை vs சோடா மணி பழங்கால டீக்கடை! ஊரே திரண்ட கலாட்டா!",
    "புல்லட் பாலுவின் 350cc புல்லட் vs அலப்பறை ஆறுமுகத்தின் வெளிநாட்டு சூப்பர்பைக் ரேஸ்!",
    "சீன் செந்திலின் மாஸ் சினிமா என்ட்ரியும் டென்ஷன் தங்கராசுவின் உலக அழிவு பீதியும்!",
    "சோம்பு சுந்தரத்தை 10 அடி நடக்க வைக்க ஊரே திரண்ட மாபெரும் கலாட்டா!",
    "தௌலத் தண்டபாணி பத்து கோடி டீலும், சோடா மணி கடையில் கடன் வாங்கும் கலாட்டாவும்!",
  ];

  const toggleCharacter = (charId: string) => {
    setSelectedChars((prev) => {
      if (prev.includes(charId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== charId);
      } else {
        return [...prev, charId];
      }
    });
  };

  const getMediaUrl = (filePath?: string) => {
    if (!filePath) return "";
    const normalized = filePath.replace(/\\/g, "/");
    const idx = normalized.indexOf("/output/");
    if (idx !== -1) {
      return `/api/media/${normalized.slice(idx + 8)}`;
    }
    return `/api/media/${normalized.replace(/^output\//, "")}`;
  };

  const handleSaveKeys = async () => {
    setSavingKeys(true);
    setKeySavedMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replicateApiToken: replicateToken || undefined,
          lumaApiKey: lumaToken || undefined,
        }),
      });
      if (res.ok) {
        setKeySavedMessage("API keys saved successfully!");
        setTimeout(() => setShowKeyModal(false), 1500);
      }
    } catch {
      // ignore
    } finally {
      setSavingKeys(false);
    }
  };

  // Launch Gemini Omni 5-6 Min Master Story + Shorts Pipeline
  const handleStartOmniStory = async () => {
    setIsRunning(true);
    setError(null);
    setOmniResult(null);
    setProgressPct(5);
    setCurrentStep(1);
    setStatusMessage("Initializing Gemini Omni Screenplay Engine for 5-6 min story...");
    setLogs(["[00:00] 🎬 Initializing Gemini Omni Screenplay Engine..."]);

    const appendLog = (msg: string) => {
      setLogs((prev) => [...prev.slice(-40), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      appendLog(`Targeting ${sceneCount} episodic scenes (total 5 to 6 minutes)...`);
      appendLog(`Starring Characters: ${selectedChars.join(", ")}`);
      setCurrentStep(1);
      setProgressPct(12);

      const interval = setInterval(() => {
        setProgressPct((old) => {
          if (old < 25) {
            setCurrentStep(1);
            setStatusMessage("Gemini Omni writing screenplay and dialogue...");
            return old + 2;
          } else if (old < 70) {
            setCurrentStep(2);
            setStatusMessage("Generating 100% animated video clips for all scenes (No static images)...");
            return old + 1;
          } else if (old < 80) {
            setCurrentStep(3);
            setStatusMessage("Merging scenes into continuous 5 to 6 minute master episode...");
            return old + 1;
          } else if (old < 92) {
            setCurrentStep(4);
            setStatusMessage("Slicing 30-second vertical Shorts for morning & evening slots...");
            return old + 1;
          }
          return old;
        });
      }, 1500);

      const res = await fetch("/api/agent/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: omniPrompt,
          characters: selectedChars,
          sceneCount,
          autoPublish,
          publishFirstPartNow,
          privacyStatus,
        }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate story episode");
      }

      setCurrentStep(5);
      setProgressPct(100);
      setStatusMessage("5-6 Min Master Story & 30s Shorts generated & queued successfully!");
      appendLog("🎉 Master Episode and repeating Morning & Evening Shorts queued!");
      setOmniResult(data.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during Omni story generation.");
      appendLog(`❌ Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Launch Quick Single Agent
  const handleStartQuickAgent = async () => {
    setIsRunning(true);
    setError(null);
    setQuickResult(null);
    setProgressPct(5);
    setCurrentStep(1);
    setStatusMessage("Quick AI Agent initialized...");
    setLogs(["[00:00] 🤖 AutoTube Quick Agent starting..."]);

    const appendLog = (msg: string) => {
      setLogs((prev) => [...prev.slice(-40), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      const interval = setInterval(() => {
        setProgressPct((old) => (old < 90 ? old + 2 : old));
      }, 1200);

      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quickTopic,
          format: quickFormat,
          language: "Tamil",
          autoPublish,
          privacyStatus,
        }),
      });

      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Execution failed");

      setProgressPct(100);
      setStatusMessage("Video rendered & published successfully!");
      appendLog("🎉 Quick video published successfully!");
      setQuickResult(data.data);
    } catch (err: any) {
      setError(err.message || "Quick Agent failed");
      appendLog(`❌ Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Publish a specific Short part on demand
  const handlePublishPartNow = async (shortItem: ShortItem) => {
    setPublishingPart(shortItem.partNumber);
    try {
      const res = await fetch("/api/agent/publish-part", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPath: shortItem.outputPath,
          thumbnailPath: shortItem.thumbnailPath,
          title: shortItem.title,
          privacyStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOmniResult((prev: any) => {
          if (!prev) return prev;
          const updatedShorts = prev.shorts.map((s: ShortItem) => {
            if (s.partNumber === shortItem.partNumber) {
              return {
                ...s,
                status: "PUBLISHED",
                youtubeUrl: data.youtubeUrl,
                youtubeVideoId: data.youtubeVideoId,
              };
            }
            return s;
          });
          return { ...prev, shorts: updatedShorts };
        });
      } else {
        alert(`Upload error: ${data.error || "Failed to publish"}`);
      }
    } catch (err: any) {
      alert(`Publish error: ${err.message}`);
    } finally {
      setPublishingPart(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Gemini Omni Story Studio
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  100% Free ($0 Cost)
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  5-6 Min Master + 8-10 Shorts
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Gemini Omni Screenplay &rarr; Prompt-Based 3D Video &rarr; 5-6m Master Video &rarr; Repeating Morning & Evening Shorts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Key className="h-4 w-4 text-amber-400" />
            API Keys
          </button>
          <Link
            href="/characters"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium border border-indigo-500/20 transition"
          >
            <Tv className="h-4 w-4" />
            3D Cast Studio
          </Link>
        </div>
      </div>

      {/* Main Mode Toggle Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800 max-w-3xl">
        <button
          onClick={() => setStudioMode("omni-story")}
          className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
            studioMode === "omni-story"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          🎬 Gemini Omni 5-6m Story
        </button>
        <button
          onClick={() => setStudioMode("gemini-flash-lite-bridge")}
          className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
            studioMode === "gemini-flash-lite-bridge"
              ? "bg-gradient-to-r from-purple-500 via-pink-600 to-rose-600 text-white shadow-lg shadow-purple-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Film className="h-4 w-4 text-pink-300" />
          ✨ Gemini Flash-Lite Video (Move & Dance)
        </button>
        <button
          onClick={() => setStudioMode("quick-agent")}
          className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
            studioMode === "quick-agent"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bot className="h-4 w-4" />
          ⚡ Quick Single Agent
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: GEMINI OMNI 5-6 MIN MASTER STORY + 8-10 SHORTS (SERIALIZED)      */}
      {/* ========================================================================= */}
      {studioMode === "omni-story" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Form Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Prompt / Story Premise */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-400" />
                  1. Story Premise / Comedy Prompt
                </label>
                <span className="text-xs text-slate-400">Gemini Omni expands into 8 to 10 scenes</span>
              </div>

              <textarea
                value={omniPrompt}
                onChange={(e) => setOmniPrompt(e.target.value)}
                disabled={isRunning}
                rows={3}
                placeholder="Enter story topic, misunderstanding, or comedy challenge..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition leading-relaxed resize-none"
              />

              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-medium">Quick Comedy Suggestions:</span>
                <div className="flex flex-wrap gap-2">
                  {comedyStoryIdeas.map((idea, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={isRunning}
                      onClick={() => setOmniPrompt(idea)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition text-left truncate max-w-md"
                    >
                      {idea.slice(0, 50)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Starring Characters Selector (Visual Turnaround Cards) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  2. Choose Starring Characters ({selectedChars.length} selected)
                </label>
                <span className="text-xs text-slate-400">Click to toggle lead characters</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                {CAST.map((char) => {
                  const isSelected = selectedChars.includes(char.id);
                  return (
                    <div
                      key={char.id}
                      onClick={() => !isRunning && toggleCharacter(char.id)}
                      className={`relative p-2.5 rounded-xl border transition cursor-pointer flex flex-col items-center text-center ${
                        isSelected
                          ? "bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                      <div className="h-16 w-16 rounded-lg bg-slate-900/90 overflow-hidden flex items-center justify-center mb-1.5 border border-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/characters/${char.id}_front.png`}
                          alt={char.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white truncate w-full">
                        {char.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate w-full">
                        {char.nickname}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Scenes Count & Strategy Options */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                3. Episode Structure & Runtime
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { count: 8, label: "8 Scenes", duration: "~5.0 Minutes", shorts: "8 Daily Shorts" },
                  { count: 9, label: "9 Scenes", duration: "~5.5 Minutes", shorts: "9 Daily Shorts" },
                  { count: 10, label: "10 Scenes", duration: "~6.0 Minutes", shorts: "10 Daily Shorts" },
                ].map((opt) => (
                  <button
                    key={opt.count}
                    type="button"
                    disabled={isRunning}
                    onClick={() => setSceneCount(opt.count)}
                    className={`p-3 rounded-xl border text-left transition ${
                      sceneCount === opt.count
                        ? "bg-sky-500/10 border-sky-500 text-sky-400 ring-1 ring-sky-500"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-sm font-bold text-white">{opt.label}</div>
                    <div className="text-xs text-sky-400">{opt.duration}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{opt.shorts}</div>
                  </button>
                ))}
              </div>

              {/* Publishing Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                    disabled={isRunning}
                    className="rounded bg-slate-950 border-slate-700 text-sky-500"
                  />
                  <span>Enable Autonomous YouTube Upload</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishFirstPartNow}
                    onChange={(e) => setPublishFirstPartNow(e.target.checked)}
                    disabled={isRunning}
                    className="rounded bg-slate-950 border-slate-700 text-sky-500"
                  />
                  <span>Publish Part 1 Short Immediately</span>
                </label>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <span>Privacy Visibility:</span>
                <select
                  value={privacyStatus}
                  onChange={(e) => setPrivacyStatus(e.target.value as any)}
                  disabled={isRunning}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="unlisted">Unlisted (Safe Testing)</option>
                  <option value="public">Public (Live to Viewers)</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            {/* Launch Action Button */}
            <button
              onClick={handleStartOmniStory}
              disabled={isRunning || !omniPrompt.trim()}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-base transition flex items-center justify-center gap-3 shadow-xl ${
                isRunning
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 shadow-sky-500/25 active:scale-[0.99]"
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                  Generating 5-6 Min Master Story & {sceneCount} Shorts...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" />
                  🚀 Launch Gemini Omni 5-6 Min Story Agent
                </>
              )}
            </button>
          </div>

          {/* Right Col: Serialization Schedule & Repeating Blueprint */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Repeat className="h-4 w-4 text-sky-400" />
                Episodic Publishing Schedule
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The agent slices each of the {sceneCount} scenes into a 30-second vertical Short and queues them in a repeating serial sequence:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 flex items-start gap-2.5">
                  <Sun className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300">☀️ Morning Slot (10:00 AM IST)</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Posts odd-numbered parts (Part 1, Part 3, Part 5...)</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/20 flex items-start gap-2.5">
                  <Moon className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo-300">🌙 Evening Slot (5:00 PM IST)</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Posts even-numbered parts (Part 2, Part 4, Part 6...)</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-start gap-2.5">
                  <Film className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-emerald-300">🎬 Full 5 to 6 Min Master Video</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">All {sceneCount} scenes merged into the continuous full episode</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-purple-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Repeats continuously with fresh serialized stories!</span>
              </div>
            </div>

            {/* Live Progress Logs */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Live Workflow Telemetry
                </span>
                {isRunning && <span className="text-sky-400 font-mono">{progressPct}%</span>}
              </div>

              <div className="h-48 overflow-y-auto bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-slate-400 space-y-1 border border-slate-900">
                {logs.length === 0 ? (
                  <span className="text-slate-600">Waiting to launch workflow...</span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="leading-tight">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: GEMINI FLASH-LITE VIDEO BRIDGE (ORIGINALLY MOVE, SPEAK & DANCE)  */}
      {/* ========================================================================= */}
      {studioMode === "gemini-flash-lite-bridge" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-pink-950/40 to-slate-900 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Google Gemini Video Integration (Veo 3.1 &amp; Flash-Lite)
              </span>
              <h2 className="text-xl font-bold text-white">
                Give Character Image &rarr; Character Originally Moves, Speaks &amp; Dances!
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Use your Gemini Pro account from <code className="bg-purple-900/40 px-1.5 py-0.5 rounded text-pink-300">gemini.google.com</code> to generate real animated character movements, speech, and energetic dance videos using the <strong>Flash-Lite / Veo 3.1</strong> engine.
              </p>
            </div>
            <a
              href="https://gemini.google.com/app?hl=en-IN&utm_source=sem&utm_medium=paid-media&utm_campaign=omni_sem&cid=microsite_gemini_video_generation_page"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
              Open Google Gemini Video Page
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Select Character & Download PNG */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  Step 1: Choose Character
                </label>
                <span className="text-xs text-slate-400">16 Fixed Cast</span>
              </div>

              <select
                value={bridgeChar}
                onChange={(e) => setBridgeChar(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {CAST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name} ({c.nickname})
                  </option>
                ))}
              </select>

              {/* Character Preview */}
              <div className="aspect-square bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/characters/${bridgeChar}_front.png`}
                  alt={bridgeChar}
                  className="h-full w-full object-contain p-4"
                />
                <a
                  href={`/characters/${bridgeChar}_front.png`}
                  download={`${bridgeChar}_character.png`}
                  className="absolute bottom-3 left-3 right-3 py-2 px-3 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 backdrop-blur-md transition shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  Download Image for Gemini (+)
                </a>
              </div>
            </div>

            {/* Step 2: Copy Gemini Prompt */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-pink-400" />
                    Step 2: Flash-Lite Video Prompt
                  </label>
                  <span className="text-xs text-pink-400">Move &amp; Dance</span>
                </div>

                <textarea
                  value={bridgePrompt}
                  onChange={(e) => setBridgePrompt(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-pink-500 transition leading-relaxed resize-none font-mono text-xs"
                />

                <div className="space-y-1 text-[11px] text-slate-400">
                  <div className="font-semibold text-slate-300">In Gemini Web UI:</div>
                  <div>1. Click <strong className="text-white">+</strong> and upload the character PNG</div>
                  <div>2. Select <strong className="text-white">Videos</strong> and model <strong className="text-pink-400">Flash-Lite</strong></div>
                  <div>3. Choose orientation: <strong className="text-sky-400">Portrait</strong> (9:16)</div>
                  <div>4. Paste this prompt and click generate!</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(bridgePrompt);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2000);
                }}
                className="w-full py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-pink-600/20"
              >
                {copiedPrompt ? "✓ Copied to Clipboard!" : "📋 Copy Prompt for Gemini Video"}
              </button>
            </div>

            {/* Step 3: Video Dropzone & Sync */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="h-4 w-4 text-sky-400" />
                  Step 3: Ingest Gemini Video
                </label>
                <p className="text-xs text-slate-400">
                  Once Gemini finishes generating your character video, drop it here to merge with speech and publish:
                </p>

                <div className="border-2 border-dashed border-slate-800 hover:border-purple-500/60 rounded-xl p-6 text-center space-y-2 bg-slate-950 transition cursor-pointer">
                  <UploadCloud className="h-8 w-8 text-slate-500 mx-auto" />
                  <div className="text-xs font-semibold text-slate-300">
                    Upload Gemini Generated MP4
                  </div>
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setUploadedBridgeVideo(url);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-300 file:text-xs"
                  />
                </div>

                {uploadedBridgeVideo && (
                  <div className="aspect-[9/16] max-h-48 bg-black rounded-xl overflow-hidden mx-auto border border-purple-500/40">
                    <video src={uploadedBridgeVideo} controls className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!uploadedBridgeVideo}
                onClick={() => {
                  alert("Gemini Flash-Lite video ready! It will be merged into the 5-6 min master story and sliced into morning/evening shorts.");
                }}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition ${
                  uploadedBridgeVideo
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                🚀 Ingest Into Master Story Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: QUICK SINGLE VIDEO AGENT (30s Short / Single Video)               */}
      {/* ========================================================================= */}
      {studioMode === "quick-agent" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white">Single Video Topic / Concept</label>
            <input
              type="text"
              value={quickTopic}
              onChange={(e) => setQuickTopic(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setQuickFormat("SHORTS")}
              className={`flex-1 p-3 rounded-xl border text-sm font-semibold transition ${
                quickFormat === "SHORTS"
                  ? "bg-sky-500/10 border-sky-500 text-sky-400"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              Vertical 9:16 Short (30s)
            </button>
            <button
              onClick={() => setQuickFormat("LONG_FORM")}
              className={`flex-1 p-3 rounded-xl border text-sm font-semibold transition ${
                quickFormat === "LONG_FORM"
                  ? "bg-sky-500/10 border-sky-500 text-sky-400"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              Horizontal 16:9 Video
            </button>
          </div>

          <button
            onClick={handleStartQuickAgent}
            disabled={isRunning || !quickTopic.trim()}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400 transition"
          >
            {isRunning ? "Running Agent..." : "🚀 Launch Quick Video Agent"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKFLOW STEPPER (VISIBLE WHILE RUNNING OR COMPLETE)                      */}
      {/* ========================================================================= */}
      {(isRunning || omniResult) && studioMode === "omni-story" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between text-sm font-bold text-white">
            <span className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-sky-400" />
              Omni Story Execution Pipeline
            </span>
            <span className="text-sky-400 font-mono">{progressPct}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
            {omniSteps.map((step) => {
              const isPast = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border text-xs ${
                    isPast
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                      : isCurrent
                      ? "bg-sky-950/30 border-sky-500/40 text-sky-200 ring-1 ring-sky-500/40"
                      : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {isPast ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400 shrink-0" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                        {step.id}
                      </span>
                    )}
                    <span className="truncate">{step.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESULTS SHOWCASE: MASTER EPISODE + 8-10 SLICED SHORTS                     */}
      {/* ========================================================================= */}
      {omniResult && (
        <div className="space-y-8 pt-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">
              Generated Master Story Package ({omniResult.projectTitle})
            </h2>
          </div>

          {/* 1. Master 5-6 Minute Episode View */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  ⭐ Full Master Episode (Continuous 5 to 6 Minutes)
                </span>
                <h3 className="text-lg font-bold text-white">{omniResult.projectTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  ⏱️ {(omniResult.masterVideo.durationSec / 60).toFixed(1)} Mins ({omniResult.masterVideo.durationSec.toFixed(1)}s)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <video
                  src={getMediaUrl(omniResult.masterVideo.outputPath)}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <p className="text-xs text-slate-400 leading-relaxed">
                  All {omniResult.shorts.length} scenes joined together with high-energy dialogue, character kinetics, and comic timing.
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="text-slate-400">File Output:</div>
                  <div className="font-mono text-slate-200 text-[11px] truncate">{omniResult.masterVideo.outputPath}</div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={getMediaUrl(omniResult.masterVideo.outputPath)}
                    download
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download 5-6m Master MP4
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Episodic 30-Second Shorts Grid (Morning & Evening) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-sky-400" />
                  Queued Episodic Shorts ({omniResult.shorts.length} Parts)
                </h3>
                <p className="text-xs text-slate-400">
                  Serialized repeating schedule: Morning 10:00 AM IST & Evening 5:00 PM IST
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {omniResult.shorts.map((short: ShortItem) => {
                const isMorning = short.slot === "MORNING";
                const dateStr = new Date(short.scheduledTime).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={short.partNumber}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative aspect-[9/16] max-h-72 bg-black overflow-hidden">
                      <video
                        src={getMediaUrl(short.outputPath)}
                        controls
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                        {isMorning ? (
                          <>
                            <Sun className="h-3 w-3 text-amber-400" />
                            Morning Part {short.partNumber}
                          </>
                        ) : (
                          <>
                            <Moon className="h-3 w-3 text-indigo-400" />
                            Evening Part {short.partNumber}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2.5">
                      <div className="text-xs font-bold text-white line-clamp-2 leading-snug">
                        {short.title}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Slot: {dateStr} IST</span>
                        <span className="font-semibold text-slate-300">30s</span>
                      </div>

                      {short.status === "PUBLISHED" && short.youtubeUrl ? (
                        <a
                          href={short.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Live on YouTube
                        </a>
                      ) : (
                        <button
                          onClick={() => handlePublishPartNow(short)}
                          disabled={publishingPart === short.partNumber}
                          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs font-semibold transition"
                        >
                          {publishingPart === short.partNumber ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3" />
                              Publish Part {short.partNumber} Now
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Agent Result View */}
      {quickResult && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="h-5 w-5" />
            Quick Agent Video Complete!
          </div>
          <div className="aspect-video max-w-lg bg-black rounded-xl overflow-hidden">
            <video src={getMediaUrl(quickResult.videoPath)} controls className="w-full h-full object-contain" />
          </div>
          {quickResult.youtubeUrl && (
            <a
              href={quickResult.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs text-sky-400 font-semibold"
            >
              <ExternalLink className="h-4 w-4" />
              Watch on YouTube: {quickResult.youtubeUrl}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
