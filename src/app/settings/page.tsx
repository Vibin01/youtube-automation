"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Key,
  Sparkles,
  Sliders,
  CheckCircle2,
  Folder,
  Shield,
  Bot,
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-3.8-flash");

  const [defaultLanguage, setDefaultLanguage] = useState<"English" | "Tamil">("English");
  const [defaultVideoFormat, setDefaultVideoFormat] = useState<"SHORTS" | "LONG_FORM">("SHORTS");
  const [defaultNiche, setDefaultNiche] = useState("Tech & AI");
  const [defaultTone, setDefaultTone] = useState("Engaging & Informative");
  const [outputDir, setOutputDir] = useState("./output");

  const [autoApproveScripts, setAutoApproveScripts] = useState(false);
  const [autoRender, setAutoRender] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [defaultVisibility, setDefaultVisibility] = useState<"private" | "unlisted" | "public">(
    "private"
  );
  const [maxRetries, setMaxRetries] = useState(3);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const d = json.data;
          setGeminiModel(d.geminiModel || "gemini-3.8-flash");
          setDefaultLanguage(d.defaultLanguage || "English");
          setDefaultVideoFormat(d.defaultVideoFormat || "SHORTS");
          setDefaultNiche(d.defaultNiche || "Tech & AI");
          setDefaultTone(d.defaultTone || "Engaging & Informative");
          setOutputDir(d.outputDir || "./output");
          setAutoApproveScripts(d.autoApproveScripts ?? false);
          setAutoRender(d.autoRender ?? false);
          setAutoPublish(d.autoPublish ?? false);
          setDefaultVisibility(d.defaultVisibility || "private");
          setMaxRetries(d.maxRetries ?? 3);
          setHasExistingKey(d.hasGeminiApiKey);
          setMaskedKey(d.geminiApiKeyMasked || "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg("");
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geminiApiKey: geminiApiKey || undefined,
          geminiModel,
          defaultLanguage,
          defaultVideoFormat,
          defaultNiche,
          defaultTone,
          outputDir,
          autoApproveScripts,
          autoRender,
          autoPublish,
          defaultVisibility,
          maxRetries,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Settings updated successfully!");
        setGeminiApiKey("");
        if (json.data.geminiApiKey) {
          setHasExistingKey(true);
        }
      } else {
        alert(json.error || "Save failed");
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error saving settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-sky-400" />
          <span>Application Settings & AI Config</span>
        </h2>
        <p className="text-xs text-slate-400">
          Configure Gemini AI models, default languages, automation rules, and output storage.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading settings...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* AI Model Configuration Card */}
          <div className="p-6 rounded-3xl glass-card space-y-5">
            <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>Google Gemini AI Configuration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Gemini Model
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommended - Fastest & Best Limits)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Storytelling & Long-form)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Gemini API Key
                  </label>
                  {hasExistingKey && (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Active: {maskedKey || "Configured"}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder={hasExistingKey ? "•••••••••••••••••••••••• (Leave blank to keep current)" : "Enter AIza... key"}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Stored securely on the server. Never exposed to browser scripts.
                </p>
              </div>
            </div>
          </div>

          {/* Content & Language Preferences */}
          <div className="p-6 rounded-3xl glass-card space-y-5">
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
              <Sliders className="h-4 w-4" />
              <span>Default Content Preferences</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Language
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Video Format
                </label>
                <select
                  value={defaultVideoFormat}
                  onChange={(e) => setDefaultVideoFormat(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="SHORTS">Shorts (9:16 Vertical)</option>
                  <option value="LONG_FORM">Long-form (16:9 Horizontal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Niche
                </label>
                <input
                  type="text"
                  value={defaultNiche}
                  onChange={(e) => setDefaultNiche(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Tone
                </label>
                <input
                  type="text"
                  value={defaultTone}
                  onChange={(e) => setDefaultTone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Automation Rules & Safety */}
          <div className="p-6 rounded-3xl glass-card space-y-5">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <Shield className="h-4 w-4" />
              <span>Automation Rules & Human Review Controls</span>
            </div>

            <div className="space-y-4 pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApproveScripts}
                  onChange={(e) => setAutoApproveScripts(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    Auto-Approve Scripts (Skip Human Review)
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Recommended OFF. Keeping this disabled allows you to review scripts before
                    rendering videos to avoid repetitive or non-compliant content.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRender}
                  onChange={(e) => setAutoRender(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    Auto-Render Approved Scripts
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Automatically render 1080p video once a script is approved.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    Auto-Publish Rendered Videos to YouTube (as Private)
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Uploads directly to your connected channel in Private mode upon render
                    completion.
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default YouTube Visibility
                </label>
                <select
                  value={defaultVisibility}
                  onChange={(e) => setDefaultVisibility(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  <option value="private">Private (Recommended for Safety)</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Output Storage Directory
                </label>
                <div className="relative">
                  <Folder className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
