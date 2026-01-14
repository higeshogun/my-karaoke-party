"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Plus, Search, Check, Loader2, Frown } from "lucide-react";
import type { KaraokeParty } from "party";
import { PreviewPlayer } from "./preview-player";
import { removeBracketedContent } from "~/utils/string";
import { decode } from "html-entities";
import { Input } from "./ui/ui/input";
import { Button } from "./ui/ui/button";
import { Skeleton } from "./ui/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/ui/alert";
import { Checkbox } from "./ui/ui/checkbox";
import { Label } from "./ui/ui/label";

type Props = {
  onVideoAdded: (videoId: string, title: string, coverUrl: string) => void;
  playlist: KaraokeParty["playlist"];
};

export function SongSearch({ onVideoAdded, playlist }: Props) {
  const [videoInputValue, setVideoInputValue] = useState("");
  const [canFetch, setCanFetch] = useState(false);
  const [embeddableOnly, setEmbeddableOnly] = useState(true);

  // Playlist mutation
  const playlistMutation = api.youtube.getPlaylist.useMutation();

  const isPlaylistUrl = (url: string) => {
    return url.includes("youtube.com/playlist") || url.includes("list=");
  };

  const { data: searchData, isError: isSearchError, refetch, isFetching: isSearchFetching, isFetched: isSearchFetched } =
    api.youtube.search.useQuery(
      {
        keyword: `${videoInputValue} karaoke`,
        videoEmbeddable: embeddableOnly,
      },
      { refetchOnWindowFocus: false, enabled: false, retry: false },
    );

  const displayData = isPlaylistUrl(videoInputValue) ? playlistMutation.data : searchData;
  const isFetching = isPlaylistUrl(videoInputValue) ? playlistMutation.isPending : isSearchFetching;
  const isError = isPlaylistUrl(videoInputValue) ? playlistMutation.isError : isSearchError;
  const isFetched = isPlaylistUrl(videoInputValue) ? playlistMutation.isSuccess : isSearchFetched;

  // const [canPlayVideos, setCanPlayVideos] = useState<string[]>([]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();

        if (isPlaylistUrl(videoInputValue)) {
          await playlistMutation.mutateAsync({ url: videoInputValue });
        } else {
          await refetch();
        }

        setCanFetch(false);
      }}
    >
      <div className="flex w-full items-center space-x-2">
        <Input
          type="text"
          name="video-url"
          placeholder="Enter artist, song name, or YouTube Playlist URL..."
          className="w-full"
          value={videoInputValue}
          onChange={(e) => {
            setVideoInputValue(e.target.value);
            setCanFetch(e.target.value.length >= 3);
          }}
          required
          minLength={3}
          autoComplete="off"
        />
        <Button type="submit" disabled={isFetching || !canFetch}>
          {isFetching ? (
            <Loader2 className="mx-1 h-6 w-6 animate-spin" />
          ) : (
            <Search className="mx-1 h-6 w-6" />
          )}
        </Button>
      </div>

      <div className="mt-2 flex items-center space-x-2">
        <Checkbox
          id="embeddable"
          checked={embeddableOnly}
          onChange={(e) => setEmbeddableOnly(e.currentTarget.checked)}
        />
        <Label htmlFor="embeddable" className="cursor-pointer text-muted-foreground">
          Only show embed-eligible videos
        </Label>
      </div>

      {isError && (
        <Alert variant={"destructive"} className="mt-4 bg-red-500 text-white">
          <Frown className="h-4 w-4" color="white" />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>
            There was an unexpected error while searching for karaoke videos.
            Try again later.
          </AlertDescription>
        </Alert>
      )}

      {isFetched && !isError && !displayData?.length && (
        <Alert className="mt-4">
          <Frown className="h-4 w-4" />
          <AlertTitle>Nothing found!</AlertTitle>
          <AlertDescription>
            No karaoke videos found for {videoInputValue}
          </AlertDescription>
        </Alert>
      )}

      {isFetching && (
        <div className="my-3 flex flex-col space-y-3 overflow-hidden sm:my-5 sm:space-y-5">
          <Skeleton className="h-32 w-full rounded-xl sm:h-48" />

          <Skeleton className="h-32 w-full rounded-xl sm:h-48" />

          <Skeleton className="h-32 w-full rounded-xl sm:h-48" />
        </div>
      )}

      {displayData && (
        <div className="my-3 flex flex-col space-y-3 overflow-hidden sm:my-5 sm:space-y-5">
          {displayData.map((video) => {
            const alreadyAdded = !!playlist.find(
              (v) => v.id === video.id.videoId && !v.playedAt,
            );

            const title = decode(removeBracketedContent(video.snippet.title));

            return (
              <div
                key={video.id.videoId}
                className={"relative h-32 overflow-hidden rounded-lg animate-in fade-in sm:h-48"}
              >
                <PreviewPlayer
                  key={video.id.videoId}
                  videoId={video.id.videoId}
                  title={title}
                  thumbnail={video.snippet.thumbnails.high.url}
                />
                <div className="absolute inset-0 z-10 rounded-lg bg-black opacity-50" />

                <div className="absolute top-0 z-30 w-full rounded-lg opacity-100">
                  <p className="bg-black bg-opacity-70 p-2 text-sm font-bold text-white line-clamp-2 sm:p-3 sm:text-xl">
                    {title}
                  </p>
                </div>

                <div className="absolute bottom-2 right-2 z-30 opacity-100 w-full flex justify-between sm:bottom-3 sm:right-3">
                  <div>
                    <p className="bg-black bg-opacity-70 p-1.5 pl-3 text-xs text-white sm:p-2 sm:pl-5 sm:text-sm">
                      {video.snippet.channelTitle}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={"default"}
                    size="icon"
                    className="shadow-xl animate-in spin-in h-8 w-8 sm:h-10 sm:w-10"
                    disabled={alreadyAdded}
                    onClick={() =>
                      onVideoAdded(
                        video.id.videoId,
                        removeBracketedContent(video.snippet.title),
                        video.snippet.thumbnails.high.url,
                      )
                    }
                  >
                    {alreadyAdded ? <Check stroke="pink" className="h-4 w-4 sm:h-5 sm:w-5" /> : <Plus className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </form>
  );
}
