import { log } from "next-axiom";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const youtubeRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        keyword: z.string(),
        videoEmbeddable: z.boolean().optional().default(true),
      }),
    )
    .query(async ({ input, ctx }) => {
      log.info("Searching for videos", {
        keyword: input.keyword,
        videoEmbeddable: input.videoEmbeddable,
      });

      const cacheKey = `youtube-search:${input.keyword}:${input.videoEmbeddable}`;

      const cachedVideos =
        await ctx.cache.get<ReturnType<typeof ctx.youtube.searchVideo>>(
          cacheKey,
        );

      if (cachedVideos === null) {
        // cache miss
        log.info("Cache miss, searching YouTube API", {
          keyword: input.keyword,
        });

        const videos = await ctx.youtube.searchVideo(
          input.keyword,
          24,
          input.videoEmbeddable,
        );

        if (videos) {
          log.info("Storing results in cache for", { keyword: input.keyword });
          await ctx.cache.set(cacheKey, videos, 60 * 60 * 24); // 24h cache
        }

        return videos;
      }

      return cachedVideos;
    }),

  getPlaylist: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      // Extract playlist ID from URL
      const url = new URL(input.url);
      const listId = url.searchParams.get("list");

      if (!listId) {
        throw new Error("Invalid playlist URL: Missing 'list' parameter");
      }

      log.info("Fetching playlist", { listId });

      const videos = await ctx.youtube.getPlaylistItems(listId, 50);
      return videos;
    }),

  getHealth: publicProcedure.query(async ({ ctx }) => {
    try {
      // Perform a lightweight check or just verify configuration
      if (!process.env.YOUTUBE_API_KEY) {
        return { status: "error", message: "Missing API Key" };
      }
      // Optional: Perform a real search to verify quota (might be expensive if spammed)
      // For now, we assume if keys are there, it's "healthy" in terms of config.
      // A deeper check could be added if needed.
      return { status: "ok", message: "Configuration present" };
    } catch (error) {
      return { status: "error", message: String(error) };
    }
  }),
});

