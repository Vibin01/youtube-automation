"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  XCircle,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface WorkflowStep {
  id: string;
  stepName: string;
  orderIndex: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  errorMessage: string | null;
}

interface AutomationJob {
  id: string;
  workflowType: string;
  status: "queued" | "processing" | "needs_review" | "approved" | "published" | "failed" | "cancelled";
  currentStep: string | null;
  progress: number;
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  createdAt: string;
  steps: WorkflowStep[];
  videoProject?: {
    id: string;
    title: string;
    format: string;
  } | null;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000); // live updates
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (jobId: string, action: "approve" | "retry" | "resume" | "cancel") => {
    try {
      setActionLoading(`${jobId}-${action}`);
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        fetchJobs();
      } else {
        alert(json.error || `Action ${action} failed`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Action failed: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-sky-400" />
            <span>Automation Jobs & Execution Logs</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time pipeline monitoring, resumable execution steps, and human review gates.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-colors"
          title="Refresh Jobs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading automation jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="py-24 text-center glass-card rounded-3xl p-8 space-y-4">
          <Clock className="h-12 w-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No Automation Jobs Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Launch an automated pipeline from the Dashboard or Content Ideas page.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => {
            const isReviewNeeded = job.status === "needs_review";
            const isFailed = job.status === "failed";
            const isProcessing = job.status === "processing" || job.status === "queued";

            return (
              <div
                key={job.id}
                className="p-6 rounded-3xl glass-card space-y-5 border border-slate-800"
              >
                {/* Job Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {job.videoProject?.title || "Automated Video Pipeline"}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          job.status === "approved" || job.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : isReviewNeeded
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                            : isFailed
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        }`}
                      >
                        {job.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Job ID: {job.id.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>Workflow: {job.workflowType}</span>
                      <span>•</span>
                      <span>
                        Retries: {job.retryCount}/{job.maxRetries}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isReviewNeeded && (
                      <button
                        onClick={() => handleAction(job.id, "approve")}
                        disabled={actionLoading === `${job.id}-approve`}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 shadow-md hover:bg-emerald-400 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve Script & Resume</span>
                      </button>
                    )}

                    {isFailed && (
                      <button
                        onClick={() => handleAction(job.id, "retry")}
                        disabled={actionLoading === `${job.id}-retry`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Retry</span>
                      </button>
                    )}

                    {job.status !== "cancelled" && job.status !== "approved" && job.status !== "published" && (
                      <button
                        onClick={() => handleAction(job.id, "cancel")}
                        disabled={actionLoading === `${job.id}-cancel`}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
                        title="Cancel Job"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Current Status */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {job.currentStep || "Processing..."}
                    </span>
                    <span className="text-sky-400 font-bold">{job.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFailed
                          ? "bg-rose-500"
                          : isReviewNeeded
                          ? "bg-amber-400"
                          : "bg-gradient-to-r from-sky-500 to-indigo-600"
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>

                {/* Human Review Gate Banner */}
                {isReviewNeeded && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
                    <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <span className="font-bold block">Human Script Approval Required</span>
                      <p className="text-[11px] text-amber-200/80 leading-relaxed">
                        The AI has generated the script and scene breakdown. Human review is enabled
                        by default to prevent non-compliant or inaccurate content. Click{" "}
                        <strong>Approve Script & Resume</strong> above or view the script in{" "}
                        <a
                          href={`/scripts?id=${job.videoProject?.id}`}
                          className="underline font-semibold"
                        >
                          Script Studio
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {job.errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Error: {job.errorMessage}</span>
                  </div>
                )}

                {/* Step Pipeline Sequence */}
                <div className="pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {job.steps.map((step) => {
                      const isStepDone = step.status === "completed";
                      const isStepRunning = step.status === "running";
                      const isStepFailed = step.status === "failed";

                      return (
                        <div
                          key={step.id}
                          className={`p-2.5 rounded-xl border text-[11px] space-y-1 transition-all ${
                            isStepDone
                              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                              : isStepRunning
                              ? "bg-sky-950/30 border-sky-500/40 text-sky-300 animate-pulse"
                              : isStepFailed
                              ? "bg-rose-950/20 border-rose-500/30 text-rose-300"
                              : "bg-slate-900/40 border-slate-800 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold capitalize truncate">
                              {step.stepName.replace(/_/g, " ")}
                            </span>
                            {isStepDone ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            ) : isStepRunning ? (
                              <RefreshCw className="h-3 w-3 animate-spin text-sky-400" />
                            ) : null}
                          </div>
                          <div className="text-[10px] text-slate-500 capitalize">{step.status}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
