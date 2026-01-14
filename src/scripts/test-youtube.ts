
import "dotenv/config";
import { env } from "~/env.js";
import { YouTubeDataAPI } from "~/utils/youtube-data-api.js";

async function main() {
    console.log("Checking API Keys...");
    if (!env.YOUTUBE_API_KEY) {
        console.error("No YOUTUBE_API_KEY found in env");
        process.exit(1);
    }

    const keys = env.YOUTUBE_API_KEY.split(",");
    console.log(`Found ${keys.length} keys`);

    const youtube = new YouTubeDataAPI(keys);

    try {
        const results = await youtube.searchVideo("karaoke test");
        console.log("Search successful!");
        console.log(`Found ${results.length} results`);
        if (results.length > 0) {
            console.log("First result:", results[0]?.snippet.title);
        }
    } catch (error) {
        console.error("Search failed:", error);
    }

    // Test Cache
    console.log("Checking Cache...");
    const { cache } = await import("~/server/cache.js");
    await cache.set("test-key", "test-value", 10);
    const val = await cache.get("test-key");
    console.log("Cache test result:", val);
    if (val === "test-value") {
        console.log("Cache working!");
    } else {
        console.log("Cache failed or using different store");
    }
}

main();

