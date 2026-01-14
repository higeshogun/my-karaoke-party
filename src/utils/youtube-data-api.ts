import axios from "axios";
import { env } from "~/env";

interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

interface Thumbnails {
  default: Thumbnail;
  medium: Thumbnail;
  high: Thumbnail;
}

interface SearchResultSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: Thumbnails;
  channelTitle: string;
  liveBroadcastContent: string;
  publishTime: string;
}

interface SearchResultItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: SearchResultSnippet;
}

interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: SearchResultItem[];
}

class YouTubeDataAPI {
  private apiKeys: string[];
  private baseUrl = "https://www.googleapis.com/youtube/v3";

  constructor(apiKeys: string[]) {
    this.apiKeys = apiKeys;
  }

  // async getVideoById(videoId: string): Promise<SearchResultItem> {
  //   const response: AxiosResponse = await axios.get(`${this.baseUrl}/videos`, {
  //     params: {
  //       key: this.apiKey,
  //       id: videoId,
  //       part: "snippet",
  //     },
  //   });
  //   return response.data.items[0];
  // }

  // async getVideoByUrl(videoUrl: string): Promise<SearchResultItem> {
  //   const match = videoUrl.match(
  //     /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
  //   );
  //   const videoId = match && match[1];

  //   if (!videoId) {
  //     throw new Error("Invalid YouTube video URL");
  //   }

  //   return this.getVideoById(videoId);
  // }

  // async getVideoByTitle(
  //   videoTitle: string,
  // ): Promise<SearchResultItem | undefined> {
  //   const response: AxiosResponse = await axios.get(`${this.baseUrl}/search`, {
  //     params: {
  //       key: this.apiKey,
  //       q: videoTitle,
  //       part: "snippet",
  //       type: "video",
  //     },
  //   });
  //   return response.data.items[0]; // Might return undefined if no match
  // }

  async searchVideo(query: string, maxResults = 10, videoEmbeddable = false) {
    let lastError: unknown;

    for (const [index, apiKey] of this.apiKeys.entries()) {
      try {
        console.log(`Searching for "${query}" with API key #${index + 1}`);

        const response = await axios.get<YouTubeSearchResponse>(
          `${this.baseUrl}/search`,
          {
            params: {
              key: apiKey,
              part: "snippet",
              type: "video",
              q: query,
              maxResults,
              videoEmbeddable: videoEmbeddable ? "true" : undefined,
            },
          },
        );

        return response.data.items;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(
            `Search for "${query}" with API key #${index + 1} failed: ${error.message}`,
            {
              status: error.response?.status,
              reason: error.response?.data?.error?.errors?.[0]?.reason,
              message: error.response?.data?.error?.message,
            },
          );
        } else {
          console.error(
            `Search for "${query}" with API key #${index + 1} failed: `,
            error,
          );
        }
        lastError = error;
        // Continue to next API key
      }
    }

    // If we get here, all API keys failed
    throw new Error(
      `All YouTube API keys failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  async getPlaylistItems(playlistId: string, maxResults = 50) {
    let lastError: unknown;

    for (const [index, apiKey] of this.apiKeys.entries()) {
      try {
        console.log(`Fetching playlist "${playlistId}" with API key #${index + 1}`);

        const response = await axios.get<{ items: { snippet: SearchResultSnippet & { resourceId: { videoId: string } } }[] }>(
          `${this.baseUrl}/playlistItems`,
          {
            params: {
              key: apiKey,
              part: "snippet",
              playlistId: playlistId,
              maxResults,
            },
          },
        );

        // Map playlist items to match SearchResultItem structure
        return response.data.items.map(item => ({
          kind: "youtube#searchResult",
          etag: "", // Not needed for our usage
          id: {
            kind: "youtube#video",
            videoId: item.snippet.resourceId.videoId
          },
          snippet: item.snippet
        } as SearchResultItem));

      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(
            `Playlist fetch for "${playlistId}" with API key #${index + 1} failed: ${error.message}`,
            {
              status: error.response?.status,
              reason: error.response?.data?.error?.errors?.[0]?.reason,
              message: error.response?.data?.error?.message,
            },
          );
        } else {
          console.error(
            `Playlist fetch for "${playlistId}" with API key #${index + 1} failed: `,
            error,
          );
        }
        lastError = error;
      }
    }

    throw new Error(
      `All YouTube API keys failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }
}

export { YouTubeDataAPI };

const apiKeys = env.YOUTUBE_API_KEY.split(",");

const youtubeAPI = new YouTubeDataAPI(apiKeys);

export default youtubeAPI;
