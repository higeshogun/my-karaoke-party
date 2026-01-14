import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const apiKeys = (process.env.YOUTUBE_API_KEY || '').split(',');
const baseUrl = "https://www.googleapis.com/youtube/v3";

console.log(`Found ${apiKeys.length} API keys.`);

async function searchVideo(query) {
    for (const [index, apiKey] of apiKeys.entries()) {
        if (!apiKey) continue;
        try {
            console.log(`Searching for "${query}" with API key #${index + 1} (${apiKey.slice(0, 5)}...)`);

            const response = await axios.get(
                `${baseUrl}/search`,
                {
                    params: {
                        key: apiKey,
                        part: "snippet",
                        type: "video",
                        q: query,
                        maxResults: 5,
                    },
                },
            );

            console.log('Success! Found items:', response.data.items.length);
            response.data.items.forEach(item => {
                console.log(`- ${item.snippet.title} (${item.id.videoId})`);
            });
            return;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(
                    `Failed with API key #${index + 1}: ${error.message}`,
                    JSON.stringify(error.response?.data?.error, null, 2)
                );
            } else {
                console.error(`Failed with API key #${index + 1}:`, error);
            }
        }
    }
}

searchVideo('eminem karaoke');
