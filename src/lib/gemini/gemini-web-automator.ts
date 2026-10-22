import puppeteer, { Browser, Page, ElementHandle } from "puppeteer-core";
import path from "path";
import fs from "fs";
import http from "http";

export interface GeminiAutomationOptions {
  imagePath: string;
  prompt: string;
  outputPath: string;
  aspectRatio?: "9:16" | "16:9";
  timeoutMs?: number;
  onProgress?: (message: string) => void;
}

export interface GeminiGenerationResult {
  success: boolean;
  outputPath: string;
  mediaType: "video" | "image";
  error?: string;
}

let activeBrowser: Browser | null = null;

/**
 * Checks if Chrome is currently running with remote debugging on port 9222
 */
async function isPort9222Active(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:9222/json/version", { timeout: 1500 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Connects to existing Chrome on port 9222 or launches Chrome with persistent profile
 */
export async function getOrLaunchGeminiBrowser(onProgress?: (msg: string) => void): Promise<Browser> {
  if (activeBrowser && activeBrowser.connected) {
    return activeBrowser;
  }

  // 1. Try connecting to already open Chrome with remote debugging
  const portActive = await isPort9222Active();
  if (portActive) {
    try {
      onProgress?.("Connecting to existing Chrome instance on port 9222...");
      activeBrowser = await puppeteer.connect({
        browserURL: "http://127.0.0.1:9222",
        defaultViewport: null,
      });
      console.log("Connected to existing Chrome on port 9222");
      return activeBrowser;
    } catch (err: any) {
      console.warn("Could not connect to port 9222:", err.message);
    }
  }

  // 2. Launch Chrome with persistent profile so Google logins & cookies are preserved
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
  ];
  const chromePath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0];
  const userProfile = process.env.USERPROFILE || "C:\\Users\\DELL";
  const profileDir = path.join(userProfile, ".gemini-browser-profile");

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  onProgress?.("Launching Google Chrome for Gemini web automation...");
  activeBrowser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    userDataDir: profileDir,
    defaultViewport: null,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-first-run",
      "--no-default-browser-check",
      "--start-maximized",
    ],
  });

  return activeBrowser;
}

/**
 * Ensures a Gemini tab is open and ready.
 */
export async function ensureGeminiTab(
  browser: Browser,
  onProgress?: (msg: string) => void
): Promise<Page> {
  const pages = await browser.pages();
  let page = pages.find((p) => p.url().includes("gemini.google.com"));

  if (!page) {
    page = pages[0] || (await browser.newPage());
    onProgress?.("Navigating to https://gemini.google.com/app...");
    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
  } else {
    await page.bringToFront();
  }

  // Wait up to 10s for DOM to settle
  await new Promise((r) => setTimeout(r, 2000));

  // Check if sign-in is required
  const needsSignIn = await page.evaluate(() => {
    const signInBtn = Array.from(document.querySelectorAll("a, button")).find(
      (b) =>
        (b.textContent || "").trim() === "Sign in" ||
        (b.textContent || "").trim() === "Log in" ||
        (b.getAttribute("aria-label") || "").includes("Sign in")
    );
    return !!signInBtn;
  });

  if (needsSignIn) {
    onProgress?.("⚠️ Google Sign-In required on Gemini! Please sign in to your Google Account in the browser window...");
    console.log("Waiting for user to sign in to Google Gemini...");
    // Wait until sign in button disappears (up to 3 minutes)
    try {
      await page.waitForFunction(
        () => {
          const btn = Array.from(document.querySelectorAll("a, button")).find(
            (b) => (b.textContent || "").trim() === "Sign in" || (b.textContent || "").trim() === "Log in"
          );
          return !btn;
        },
        { timeout: 180000 }
      );
      onProgress?.("✅ Signed in to Google Gemini successfully!");
    } catch {
      console.warn("Sign-in wait timed out or proceed anyway");
    }
  }

  return page;
}

/**
 * Automates sending a character image + prompt to Gemini web, waits for generation, and downloads the output clip.
 */
export async function generateGeminiWebVideoClip(
  options: GeminiAutomationOptions
): Promise<GeminiGenerationResult> {
  const { imagePath, prompt, outputPath, aspectRatio = "9:16", timeoutMs = 180000, onProgress } = options;

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Character image not found at: ${imagePath}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const browser = await getOrLaunchGeminiBrowser(onProgress);
  const page = await ensureGeminiTab(browser, onProgress);

  onProgress?.("Preparing Gemini chat session for video generation...");

  // Click 'New chat' if available to keep context clean
  try {
    const newChatBtn = await page.$('button[aria-label*="New chat"], a[aria-label*="New chat"]');
    if (newChatBtn) {
      await newChatBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }
  } catch {
    // ignore
  }

  // 1. Upload character image
  onProgress?.(`Uploading character image (${path.basename(imagePath)}) to Gemini...`);

  // Ensure file inputs are available
  let fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length === 0) {
    const uploadBtn = await page.$('button[aria-label*="Upload"], button[aria-label*="tools"]');
    if (uploadBtn) {
      await uploadBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      fileInputs = await page.$$('input[type="file"]');
    }
  }

  // Find image file input
  let imageInput: ElementHandle<HTMLInputElement> | null = null;
  for (const input of fileInputs) {
    const accept = await page.evaluate((el) => el.getAttribute("accept"), input);
    if (accept && accept.includes("image")) {
      imageInput = input as ElementHandle<HTMLInputElement>;
      break;
    }
  }

  if (!imageInput && fileInputs.length > 0) {
    imageInput = fileInputs[0] as ElementHandle<HTMLInputElement>;
  }

  if (!imageInput) {
    throw new Error("Could not find file upload input on Gemini web page.");
  }

  await imageInput.uploadFile(imagePath);
  onProgress?.("Character image uploaded. Waiting for thumbnail preview to process...");

  // Wait for attachment preview
  await page.waitForFunction(
    () => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs.some(
        (img) => img.src && (img.src.startsWith("blob:") || img.src.includes("googleusercontent"))
      );
    },
    { timeout: 20000 }
  );

  await new Promise((r) => setTimeout(r, 1500));

  // 2. Type video prompt into the editor
  const enrichedPrompt = `Generate a 3D animated comedy video clip starring this character. Aspect ratio: ${aspectRatio}. Action: ${prompt}. Cinematic lighting, fluid cartoon animation, expressive facial comedy.`;

  onProgress?.("Entering video generation prompt into Gemini...");

  const editorSelector = "div.ql-editor[contenteditable='true'], [contenteditable='true'], rich-textarea";
  await page.waitForSelector(editorSelector, { timeout: 15000 });

  const editorHandle = await page.$(editorSelector);
  if (editorHandle) {
    await editorHandle.focus();
  }

  await page.evaluate(
    (selector, text) => {
      const editor = document.querySelector(selector) as HTMLElement;
      if (editor) {
        editor.focus();
        document.execCommand("insertText", false, text);
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },
    editorSelector,
    enrichedPrompt
  );

  await new Promise((r) => setTimeout(r, 1000));

  // 3. Send prompt
  onProgress?.("Submitting prompt to Gemini. Generating video animation...");

  // Look for send button
  const sendClicked = await page.evaluate(() => {
    const sendBtn = Array.from(document.querySelectorAll("button")).find((b) => {
      const aria = (b.getAttribute("aria-label") || "").toLowerCase();
      return (
        aria.includes("send message") ||
        aria.includes("submit") ||
        b.getAttribute("aria-label") === "Send"
      );
    });
    if (sendBtn && !sendBtn.disabled) {
      sendBtn.click();
      return true;
    }
    return false;
  });

  if (!sendClicked) {
    // Fallback: press Enter in editor
    await page.keyboard.press("Enter");
  }

  // 4. Wait for generation to complete and capture video output
  onProgress?.("Waiting for Gemini to finish generating the video clip (this takes 30-90s)...");

  const startTime = Date.now();
  let videoFound = false;

  while (Date.now() - startTime < timeoutMs) {
    await new Promise((r) => setTimeout(r, 3000));

    // Check if a <video> element exists
    const videoData = await page.evaluate(async () => {
      const videos = Array.from(document.querySelectorAll("video"));
      for (const v of videos) {
        const src = v.currentSrc || v.src || v.querySelector("source")?.src;
        if (src && src.length > 5) {
          try {
            const res = await fetch(src);
            const blob = await res.blob();
            const reader = new FileReader();
            return new Promise<{ ok: boolean; base64?: string; src: string }>((resolve) => {
              reader.onloadend = () => {
                const b64 = (reader.result as string).split(",")[1];
                resolve({ ok: true, base64: b64, src });
              };
              reader.onerror = () => resolve({ ok: false, src });
              reader.readAsDataURL(blob);
            });
          } catch (e: any) {
            return { ok: false, src };
          }
        }
      }

      // Also check for download button
      const downloadBtn = Array.from(document.querySelectorAll("a[download], button[aria-label*='Download']")).find(
        (el) => (el as HTMLAnchorElement).href?.includes(".mp4") || el.getAttribute("aria-label")?.includes("video")
      );
      if (downloadBtn) {
        const href = (downloadBtn as HTMLAnchorElement).href;
        if (href) return { ok: true, downloadUrl: href };
      }

      return null;
    });

    const vData = videoData as any;
    if (vData && vData.ok && vData.base64) {
      onProgress?.("Received video clip from Gemini! Saving to output...");
      fs.writeFileSync(outputPath, Buffer.from(vData.base64, "base64"));
      videoFound = true;
      break;
    }

    if (vData && vData.downloadUrl) {
      onProgress?.("Downloading video clip from URL...");
      const res = await fetch(vData.downloadUrl);
      const arr = await res.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(arr));
      videoFound = true;
      break;
    }

    // Check if generation finished with an image instead
    const isGenerating = await page.evaluate(() => {
      const stopBtn = document.querySelector('button[aria-label*="Stop"]');
      const spinner = document.querySelector(".mat-mdc-progress-spinner, mat-spinner");
      return !!stopBtn || !!spinner;
    });

    if (!isGenerating && Date.now() - startTime > 20000) {
      // Check if image card was generated
      const generatedImg = await page.evaluate(async () => {
        const imgs = Array.from(document.querySelectorAll("img")).filter(
          (img) => img.src && img.src.includes("googleusercontent.com") && img.width > 200
        );
        const lastImg = imgs[imgs.length - 1];
        if (!lastImg) return null;
        try {
          const res = await fetch(lastImg.src);
          const blob = await res.blob();
          const reader = new FileReader();
          return new Promise<{ base64: string }>((resolve) => {
            reader.onloadend = () => {
              const b64 = (reader.result as string).split(",")[1];
              resolve({ base64: b64 });
            };
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      });

      if (generatedImg && generatedImg.base64) {
        // Gemini returned a high-res image
        const tempImgPath = outputPath.replace(/\.mp4$/, ".png");
        fs.writeFileSync(tempImgPath, Buffer.from(generatedImg.base64, "base64"));
        onProgress?.("Gemini returned generated scene visual. Animate to MP4 video clip...");

        // Procedurally animate into MP4 using our kinetic animator
        const { generateProceduralAnimationVideo } = await import("../video/ai-video-generator");
        await generateProceduralAnimationVideo({
          prompt,
          outputPath,
          durationSec: 5.0,
          format: aspectRatio === "9:16" ? "SHORTS" : "LONG_FORM",
        });

        return {
          success: true,
          outputPath,
          mediaType: "image",
        };
      }
    }
  }

  if (videoFound && fs.existsSync(outputPath)) {
    return {
      success: true,
      outputPath,
      mediaType: "video",
    };
  }

  throw new Error("Gemini video generation timed out or video element not captured.");
}
