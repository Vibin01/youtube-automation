import { prisma } from "../database/prisma";
import { getAppSettings } from "../database/settings";
import { generateContentIdeas, generateFullScript } from "../gemini/client";
import { renderVideoProject } from "../video/renderer";
import { uploadVideoToYouTube } from "../youtube/client";

export type JobStatus =
  | "queued"
  | "processing"
  | "needs_review"
  | "approved"
  | "published"
  | "failed"
  | "cancelled";

export type StepName =
  | "generate_idea"
  | "generate_script"
  | "review_approval"
  | "render_video"
  | "publish_youtube";

interface PipelinePayload {
  niche?: string;
  category?: "educational" | "entertainment" | "storytelling" | "kids";
  format?: "SHORTS" | "LONG_FORM";
  language?: "English" | "Tamil";
  targetDurationSec?: number;
  tone?: string;
  title?: string;
  autoApprove?: boolean;
  autoPublish?: boolean;
}

/**
 * Creates a new Automation Job with sequenced workflow steps in SQLite.
 */
export async function createAutomationJob(params: {
  workflowType?: string;
  videoProjectId?: string;
  payload: PipelinePayload;
}) {
  const settings = await getAppSettings();

  const job = await prisma.automationJob.create({
    data: {
      workflowType: params.workflowType || "FULL_PIPELINE",
      status: "queued",
      progress: 0,
      retryCount: 0,
      maxRetries: settings.maxRetries || 3,
      videoProjectId: params.videoProjectId,
      payload: JSON.stringify(params.payload),
    },
  });

  const steps: StepName[] = [
    "generate_idea",
    "generate_script",
    "review_approval",
    "render_video",
    "publish_youtube",
  ];

  for (let i = 0; i < steps.length; i++) {
    await prisma.workflowStep.create({
      data: {
        automationJobId: job.id,
        stepName: steps[i],
        orderIndex: i,
        status: "pending",
      },
    });
  }

  return job;
}

/**
 * Executes or resumes an automation job from the last unfinished step.
 */
export async function executeAutomationJob(jobId: string): Promise<void> {
  const job = await prisma.automationJob.findUnique({
    where: { id: jobId },
    include: {
      steps: { orderBy: { orderIndex: "asc" } },
      videoProject: true,
    },
  });

  if (!job) {
    throw new Error(`Automation job ${jobId} not found.`);
  }

  if (job.status === "cancelled") {
    console.log(`Job ${jobId} was cancelled.`);
    return;
  }

  const settings = await getAppSettings();
  const payload: PipelinePayload = job.payload ? JSON.parse(job.payload) : {};

  await prisma.automationJob.update({
    where: { id: jobId },
    data: {
      status: "processing",
      startedAt: job.startedAt || new Date(),
      errorMessage: null,
    },
  });

  try {
    let currentProjectId = job.videoProjectId;

    for (const step of job.steps) {
      if (step.status === "completed") {
        continue; // Resumable: skip completed steps
      }

      // Check for mid-run cancellation
      const freshJob = await prisma.automationJob.findUnique({ where: { id: jobId } });
      if (freshJob?.status === "cancelled") {
        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { status: "skipped" },
        });
        return;
      }

      await prisma.workflowStep.update({
        where: { id: step.id },
        data: { status: "running", startedAt: new Date() },
      });

      await prisma.automationJob.update({
        where: { id: jobId },
        data: {
          currentStep: step.stepName,
          progress: Math.round((step.orderIndex / job.steps.length) * 100),
        },
      });

      // Step 1: Generate Idea
      if (step.stepName === "generate_idea") {
        if (!payload.title && !currentProjectId) {
          const ideas = await generateContentIdeas({
            niche: payload.niche || settings.defaultNiche,
            category: payload.category || "educational",
            format: payload.format || settings.defaultVideoFormat,
            language: payload.language || settings.defaultLanguage,
            targetAudience: "General Audience",
            tone: payload.tone || settings.defaultTone,
            count: 1,
          });

          const chosenIdea = ideas[0];
          const ideaRecord = await prisma.contentIdea.create({
            data: {
              title: chosenIdea.title,
              hook: chosenIdea.hook,
              description: chosenIdea.description,
              targetAudience: chosenIdea.targetAudience,
              niche: chosenIdea.niche,
              format: payload.format || settings.defaultVideoFormat,
              language: payload.language || settings.defaultLanguage,
              category: payload.category || "educational",
              status: "APPROVED",
              estimatedDuration: chosenIdea.estimatedDuration,
              tags: JSON.stringify(chosenIdea.tags),
            },
          });

          const newProject = await prisma.videoProject.create({
            data: {
              title: chosenIdea.title,
              description: chosenIdea.description,
              format: payload.format || settings.defaultVideoFormat,
              language: payload.language || settings.defaultLanguage,
              status: "SCRIPTING",
              contentIdeaId: ideaRecord.id,
              tags: JSON.stringify(chosenIdea.tags),
            },
          });

          currentProjectId = newProject.id;
          await prisma.automationJob.update({
            where: { id: jobId },
            data: { videoProjectId: currentProjectId },
          });
        } else if (!currentProjectId && payload.title) {
          const newProject = await prisma.videoProject.create({
            data: {
              title: payload.title,
              format: payload.format || settings.defaultVideoFormat,
              language: payload.language || settings.defaultLanguage,
              status: "SCRIPTING",
            },
          });
          currentProjectId = newProject.id;
          await prisma.automationJob.update({
            where: { id: jobId },
            data: { videoProjectId: currentProjectId },
          });
        }

        await prisma.workflowStep.update({
          where: { id: step.id },
          data: {
            status: "completed",
            completedAt: new Date(),
            resultData: JSON.stringify({ projectId: currentProjectId }),
          },
        });
      }

      // Step 2: Generate Script
      else if (step.stepName === "generate_script") {
        if (!currentProjectId) {
          throw new Error("No video project associated with this job step.");
        }

        const project = await prisma.videoProject.findUnique({
          where: { id: currentProjectId },
          include: { script: true },
        });

        if (!project) throw new Error("Project not found");

        if (!project.script) {
          const scriptOutput = await generateFullScript({
            title: project.title,
            format: project.format as "SHORTS" | "LONG_FORM",
            language: project.language as "English" | "Tamil",
            niche: payload.niche || settings.defaultNiche,
            category: payload.category || "educational",
            targetDurationSec: payload.targetDurationSec || (project.format === "SHORTS" ? 50 : 300),
            tone: payload.tone || settings.defaultTone,
          });

          await prisma.script.create({
            data: {
              videoProjectId: currentProjectId,
              title: scriptOutput.title,
              hook: scriptOutput.hook,
              body: scriptOutput.body,
              callToAction: scriptOutput.callToAction,
              description: scriptOutput.description,
              hashtags: JSON.stringify(scriptOutput.hashtags),
              thumbnailIdeas: JSON.stringify(scriptOutput.thumbnailIdeas),
              targetDurationSec: payload.targetDurationSec || 60,
              isApproved: payload.autoApprove || settings.autoApproveScripts,
            },
          });

          for (const s of scriptOutput.scenes) {
            await prisma.scene.create({
              data: {
                videoProjectId: currentProjectId,
                orderIndex: s.orderIndex,
                narration: s.narration,
                visualPrompt: s.visualPrompt,
                captionText: s.captionText,
                duration: s.duration || 5.0,
                status: "PENDING",
              },
            });
          }

          await prisma.videoProject.update({
            where: { id: currentProjectId },
            data: { status: "SCRIPT_READY" },
          });
        }

        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }

      // Step 3: Human Review / Safety Check
      else if (step.stepName === "review_approval") {
        if (!currentProjectId) throw new Error("No project found for approval check.");

        const project = await prisma.videoProject.findUnique({
          where: { id: currentProjectId },
          include: { script: true },
        });

        const isApproved =
          project?.humanApproved ||
          project?.script?.isApproved ||
          payload.autoApprove ||
          settings.autoApproveScripts;

        if (!isApproved) {
          // Pause execution and wait for human review in Dashboard UI
          await prisma.workflowStep.update({
            where: { id: step.id },
            data: { status: "pending" },
          });

          await prisma.automationJob.update({
            where: { id: jobId },
            data: {
              status: "needs_review",
              currentStep: "Awaiting human script approval",
            },
          });
          return;
        }

        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }

      // Step 4: Render Video
      else if (step.stepName === "render_video") {
        if (!currentProjectId) throw new Error("No project found to render.");

        await renderVideoProject(currentProjectId, (percent, msg) => {
          prisma.automationJob
            .update({
              where: { id: jobId },
              data: {
                progress: Math.min(95, Math.round(50 + percent * 0.4)),
                currentStep: msg,
              },
            })
            .catch(() => {});
        });

        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }

      // Step 5: Publish YouTube
      else if (step.stepName === "publish_youtube") {
        if (!currentProjectId) throw new Error("No project to publish.");

        const project = await prisma.videoProject.findUnique({
          where: { id: currentProjectId },
          include: {
            renders: {
              where: { status: "COMPLETED" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });

        const shouldAutoPublish = payload.autoPublish || settings.autoPublish;
        const render = project?.renders[0];

        if (shouldAutoPublish && render && render.outputPath) {
          const channel = await prisma.youTubeChannel.findFirst({ where: { isConnected: true } });
          if (channel) {
            const uploadRes = await uploadVideoToYouTube({
              videoFilePath: render.outputPath,
              thumbnailFilePath: render.thumbnailPath || undefined,
              title: project.title,
              description: project.description || project.title,
              tags: project.tags ? JSON.parse(project.tags) : [],
              privacyStatus: "private", // Safe initial upload
              madeForKids: project.madeForKids,
              channelId: channel.id,
            });

            await prisma.publishingJob.create({
              data: {
                videoProjectId: currentProjectId,
                channelId: channel.id,
                title: project.title,
                description: project.description,
                privacyStatus: "private",
                youtubeVideoId: uploadRes.videoId,
                youtubeVideoUrl: uploadRes.videoUrl,
                status: "PUBLISHED",
              },
            });

            await prisma.videoProject.update({
              where: { id: currentProjectId },
              data: { status: "PUBLISHED" },
            });
          }
        }

        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }
    }

    // Mark Job Complete
    await prisma.automationJob.update({
      where: { id: jobId },
      data: {
        status: "approved",
        progress: 100,
        currentStep: "Completed successfully",
        completedAt: new Date(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error in automation job ${jobId}:`, err);

    const currentRetry = job.retryCount + 1;
    const canRetry = currentRetry <= (job.maxRetries || 3);

    await prisma.automationJob.update({
      where: { id: jobId },
      data: {
        status: canRetry ? "queued" : "failed",
        retryCount: currentRetry,
        errorMessage: err.message || "Unknown error occurred",
      },
    });

    throw error;
  }
}
