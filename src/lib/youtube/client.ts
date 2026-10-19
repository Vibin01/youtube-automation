import { google } from "googleapis";
import fs from "fs";
import { prisma } from "../database/prisma";

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/youtube/callback";

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generates the Google OAuth authorization URL.
 */
export function getAuthUrl(): string {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) {
    throw new Error(
      "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment or Settings."
    );
  }

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: YOUTUBE_SCOPES,
  });
}

/**
 * Exchanges authorization code for tokens and persists or updates the channel in SQLite.
 */
export async function handleOAuthCallback(code: string) {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) {
    throw new Error("Google OAuth credentials missing.");
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const channelRes = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  });

  const channelItem = channelRes.data.items?.[0];
  if (!channelItem || !channelItem.id) {
    throw new Error("No YouTube channel found for this Google account.");
  }

  const channelId = channelItem.id;
  const snippet = channelItem.snippet;
  const stats = channelItem.statistics;

  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

  const channel = await prisma.youTubeChannel.upsert({
    where: { channelId },
    update: {
      title: snippet?.title || "My YouTube Channel",
      customUrl: snippet?.customUrl || null,
      description: snippet?.description || null,
      thumbnailUrl: snippet?.thumbnails?.default?.url || null,
      subscriberCount: parseInt(stats?.subscriberCount || "0", 10),
      videoCount: parseInt(stats?.videoCount || "0", 10),
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || undefined,
      tokenExpiry: expiry,
      isConnected: true,
    },
    create: {
      channelId,
      title: snippet?.title || "My YouTube Channel",
      customUrl: snippet?.customUrl || null,
      description: snippet?.description || null,
      thumbnailUrl: snippet?.thumbnails?.default?.url || null,
      subscriberCount: parseInt(stats?.subscriberCount || "0", 10),
      videoCount: parseInt(stats?.videoCount || "0", 10),
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || null,
      tokenExpiry: expiry,
      isConnected: true,
    },
  });

  return channel;
}

/**
 * Returns an authenticated YouTube API client for a connected channel.
 */
export async function getAuthenticatedYouTubeClient(channelDbId?: string) {
  let channel = channelDbId
    ? await prisma.youTubeChannel.findUnique({ where: { id: channelDbId } })
    : await prisma.youTubeChannel.findFirst({ where: { isConnected: true } });

  if (!channel) {
    const envRefreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
    const envChannelId = process.env.YOUTUBE_CHANNEL_ID || "UCuMrJMyuch2dn4ldJejdiVQ";
    const envChannelTitle = process.env.YOUTUBE_CHANNEL_TITLE || "Happy Kuttu Song";

    if (envRefreshToken) {
      const oauth2Client = getOAuthClient();
      if (oauth2Client) {
        oauth2Client.setCredentials({ refresh_token: envRefreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();

        channel = await prisma.youTubeChannel.upsert({
          where: { channelId: envChannelId },
          update: {
            title: envChannelTitle,
            accessToken: credentials.access_token || "",
            refreshToken: envRefreshToken,
            tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
            isConnected: true,
          },
          create: {
            channelId: envChannelId,
            title: envChannelTitle,
            accessToken: credentials.access_token || "",
            refreshToken: envRefreshToken,
            tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
            isConnected: true,
          },
        });
        oauth2Client.setCredentials(credentials);
        return { youtube: google.youtube({ version: "v3", auth: oauth2Client }), channel };
      }
    }
    throw new Error("No connected YouTube channel found. Please connect your channel first.");
  }

  const oauth2Client = getOAuthClient();
  if (!oauth2Client) {
    throw new Error("Google OAuth credentials missing in environment variables.");
  }

  oauth2Client.setCredentials({
    access_token: channel.accessToken,
    refresh_token: channel.refreshToken || undefined,
  });

  // Handle token refresh if close to expiry
  if (channel.tokenExpiry && channel.tokenExpiry.getTime() <= Date.now() + 5 * 60 * 1000) {
    if (channel.refreshToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await prisma.youTubeChannel.update({
          where: { id: channel.id },
          data: {
            accessToken: credentials.access_token || channel.accessToken,
            tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
          },
        });
        oauth2Client.setCredentials(credentials);
      } catch (refreshErr) {
        console.error("Token refresh failed:", refreshErr);
      }
    }
  }

  return { youtube: google.youtube({ version: "v3", auth: oauth2Client }), channel };
}

/**
 * Uploads a video to YouTube with privacy, metadata, and audience settings.
 */
export async function uploadVideoToYouTube(params: {
  videoFilePath: string;
  thumbnailFilePath?: string;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: "private" | "unlisted" | "public";
  scheduledPublishTime?: Date | string;
  madeForKids: boolean;
  channelId?: string;
}): Promise<{ videoId: string; videoUrl: string }> {
  if (!fs.existsSync(params.videoFilePath)) {
    throw new Error(`Video file not found at path: ${params.videoFilePath}`);
  }

  const { youtube } = await getAuthenticatedYouTubeClient(params.channelId);

  const statusObj: {
    privacyStatus: string;
    selfDeclaredMadeForKids: boolean;
    publishAt?: string;
  } = {
    privacyStatus: params.privacyStatus || "private",
    selfDeclaredMadeForKids: params.madeForKids,
  };

  if (params.scheduledPublishTime) {
    statusObj.privacyStatus = "private";
    statusObj.publishAt = new Date(params.scheduledPublishTime).toISOString();
  }

  try {
    const uploadRes = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: params.title.slice(0, 100),
          description: params.description.slice(0, 5000),
          tags: params.tags?.slice(0, 30) || [],
          categoryId: "28", // Science & Technology
        },
        status: statusObj,
      },
      media: {
        body: fs.createReadStream(params.videoFilePath),
      },
    });

    const videoId = uploadRes.data.id;
    if (!videoId) {
      throw new Error("YouTube upload succeeded but no video ID returned.");
    }

    // Upload thumbnail if provided
    if (params.thumbnailFilePath && fs.existsSync(params.thumbnailFilePath)) {
      try {
        await youtube.thumbnails.set({
          videoId,
          media: {
            body: fs.createReadStream(params.thumbnailFilePath),
          },
        });
      } catch (thumbErr) {
        console.warn("Failed to upload custom thumbnail (channel might lack verified custom thumbnail rights):", thumbErr);
      }
    }

    return {
      videoId,
      videoUrl: `https://youtu.be/${videoId}`,
    };
  } catch (error: unknown) {
    const err = error as { code?: number; errors?: Array<{ reason: string; message: string }> };
    if (err.errors && err.errors.length > 0) {
      const reason = err.errors[0].reason;
      if (reason === "quotaExceeded") {
        throw new Error("YouTube API daily quota exceeded. Please wait for quota reset or request a quota increase in Google Cloud Console.");
      }
      if (reason === "uploadLimitExceeded") {
        throw new Error("YouTube account upload limit exceeded for today. Please wait 24 hours.");
      }
    }
    throw error;
  }
}
