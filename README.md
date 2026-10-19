# AutoTube AI — Zero-Cost YouTube Automation Agent

An autonomous full-stack AI YouTube automation platform built with **Next.js 16 (App Router), Node.js, TypeScript, Tailwind CSS, SQLite, Prisma ORM, Google Gemini AI, Edge-TTS, and FFmpeg**.

This project provides an end-to-end content creation pipeline from viral idea generation to scriptwriting, neural voice synthesis, 1080p video rendering (both **Shorts 9:16** and **Long-form 16:9**), high-CTR thumbnail generation, and YouTube publishing via Google OAuth 2.0.

> [!TIP]
> **₹0 Initial Budget Architecture**: Uses local SQLite, bundled FFmpeg (`ffmpeg-static`), high-fidelity free neural voice synthesis (`edge-tts`), Sharp image processing, and Google's official `@google/genai` free tier SDK.

---

## 🚀 Key Features

1. **Dashboard Overview**: Track total projects, in-progress renders, published videos, channel audience, and trigger 1-click autonomous workflows.
2. **Content Ideas Studio**: Brainstorm viral topics with curiosity hooks, category filtering (educational, entertainment, storytelling, kids), and multi-lingual support (**English** & **Tamil**).
3. **Script Studio**: Full scene-by-scene script editor with duration sliders, visual instructions, and built-in **COPPA / Kids Safety compliance checks**.
4. **Video Studio & Render Engine**: Preview scenes, test voiceovers, render 1080p MP4 videos using bundled FFmpeg, and design high-contrast YouTube thumbnails with Sharp.
5. **Video Library**: Stream rendered videos directly in the browser with seekable HTTP range playback, inspect file metrics, and download.
6. **Publishing & YouTube OAuth 2.0**: Connect your channel securely, review metadata, enforce human-approval gates, set private/unlisted/public visibility, and schedule uploads.
7. **Analytics**: Monitor subscriber growth, video throughput, and Shorts vs. Long-form performance ratios.
8. **Settings**: Switch Gemini models (`gemini-2.5-flash`, `gemini-1.5-flash`), configure server-side API keys, adjust output paths, and toggle automation policies.
9. **Automation Engine & Local Worker**: Resumable database-backed job queue with retry handling, step tracking, and background worker (`npm run worker`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS with custom Glassmorphism design tokens |
| **AI Integration** | Google Gemini API via official `@google/genai` SDK |
| **Database & ORM** | SQLite with Prisma ORM 6 |
| **Speech Synthesis (TTS)** | Free Neural Edge-TTS (English & Tamil voices) |
| **Video Rendering** | Bundled FFmpeg (`ffmpeg-static` & `ffprobe-static`) |
| **Image Processing** | Sharp (high-resolution thumbnail and scene cards) |
| **YouTube API** | YouTube Data API v3 & YouTube Analytics with OAuth 2.0 |
| **Validation** | Zod schemas |
| **Testing** | Vitest test runner |

---

## 💻 Windows Setup & Installation

### 1. Prerequisites
- **Node.js**: v20+ or v24+
- **Python**: 3.10+ (with `pip` on PATH)
- **Git**: Installed

### 2. Clone and Install Dependencies
```powershell
# Navigate to project directory
cd D:\vibin\automation\youtube-automation-v2

# Install Node dependencies
npm install --legacy-peer-deps

# Install free Neural Edge-TTS for Python
python -m pip install edge-tts
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` to configure your values:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-2.5-flash"
DATABASE_URL="file:./dev.db"
OUTPUT_DIR="./output"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Google OAuth for YouTube Uploads
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/youtube/callback"
```

### 4. Initialize Database
```powershell
npx prisma db push
```

### 5. Run the Application
```powershell
# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Google Cloud OAuth Configuration Guide

To enable direct YouTube uploading and channel analytics:

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (e.g., `AutoTube Studio`).
3. Enable APIs:
   - **YouTube Data API v3**
   - **YouTube Analytics API**
4. Configure **OAuth Consent Screen**:
   - User Type: **External**
   - Scopes:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/yt-analytics.readonly`
   - Test Users: Add your personal YouTube channel Google email address.
5. Create Credentials:
   - **Create Credentials** -> **OAuth Client ID** -> **Web Application**
   - Authorized redirect URIs: `http://localhost:3000/api/youtube/callback`
6. Copy the **Client ID** and **Client Secret** into your `.env.local`.

---

## 🤖 Running the Background Worker

For automated, hands-off background queue processing:

```powershell
npm run worker
```

The worker continuously polls SQLite for `queued` automation jobs, executes workflow steps, pauses at review gates, and updates progress in real time.

---

## 🧪 Testing

Run unit and integration tests covering Gemini validation, Edge-TTS audio synthesis, Sharp thumbnail generation, and automation state machines:

```powershell
npm test
```

---

## 🛡️ YouTube Policy & Compliance

- **Human Review Enabled**: Content creation defaults to human review to prevent accidental uploads of unverified claims or repetitive content.
- **COPPA / Kids Safety**: Requires explicit declaration of audience setting for each video.
- **Safe Initial Visibility**: Default uploads start in **Private** mode for safe verification in YouTube Studio before going public.
