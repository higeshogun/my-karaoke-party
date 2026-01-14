/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeProps, type YouTubePlayer } from "react-youtube";
import { QrCode } from "./qr-code";
import { type VideoInPlaylist } from "party";
import { decode } from "html-entities";
import { cn } from "~/lib/utils";
import { Button } from "./ui/ui/button";
import { MicVocal, SkipForward, Youtube } from "lucide-react";
import { Spinner } from "./ui/ui/spinner";

type Props = {
  joinPartyUrl: string;
  video: VideoInPlaylist;
  isFullscreen: boolean;
  onPlayerEnd: () => void;
  onTogglePlayPauseRef?: React.MutableRefObject<(() => void) | null>;
};

export function Player({
  joinPartyUrl,
  video,
  isFullscreen = false,
  onPlayerEnd,
  onTogglePlayPauseRef,
}: Props) {
  const playerRef = useRef<YouTubePlayer>(null);

  const [isReady, setIsReady] = useState(false);
  const [showOpenInYouTubeButton, setShowOpenInYouTubeButton] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = useCallback(() => {
    if (playerRef.current && isReady) {
      const playerState = playerRef.current.getPlayerState();
      // YouTube player states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
      if (playerState === 1) {
        // Playing - pause it
        playerRef.current.pauseVideo();
      } else if (playerState === 2 || playerState === 5 || playerState === -1) {
        // Paused, cued, or unstarted - play it
        playerRef.current.playVideo();
      }
    }
  }, [isReady]);

  // Set ref for global play/pause
  useEffect(() => {
    if (onTogglePlayPauseRef && isReady) {
      onTogglePlayPauseRef.current = togglePlayPause;
    }
  }, [onTogglePlayPauseRef, togglePlayPause, isReady]);

  const opts: YouTubeProps["opts"] = {
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      start: 0,
      autoplay: 0,
      rel: 0,
      controls: 1,
    },
  };

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    console.log("Player ready", { event });
    // access to player in all event handlers via event.target
    playerRef.current = event.target;

    const playerState = event.target.getPlayerState();

    if (playerState !== -1) {
      setIsReady(true);
    }
  };

  const onPlayerPlay: YouTubeProps["onPlay"] = (_event) => {
    console.log("handlePlay");
    setIsPlaying(true);
  };

  const onPlayerPause: YouTubeProps["onPause"] = (_event) => {
    console.log("handlePause");
    setIsPlaying(false);
  };

  const onPlayerError: YouTubeProps["onError"] = (_event) => {
    setShowOpenInYouTubeButton(true);
  };

  const openYouTubeTab = () => {
    window.open(
      `https://www.youtube.com/watch?v=${video.id}#mykaraokeparty`,
      "_blank",
      "fullscreen=yes"
    );

    if (onPlayerEnd) {
      onPlayerEnd();
    }
  };

  if (showOpenInYouTubeButton) {
    return (
      <div
        className={cn(
          "mx-auto flex h-full w-full flex-col items-center justify-between space-y-4 p-3 pb-1 text-center sm:space-y-6 sm:p-4",
          isFullscreen && "bg-gradient"
        )}
      >
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-outline scroll-m-20 text-xl font-extrabold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            {decode(video.title)}
          </h1>
          <h2 className="text-outline scroll-m-20 text-lg font-bold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
            <MicVocal className="mr-1 inline text-primary sm:mr-2" size={20} />
            {video.singerName}
            <MicVocal
              className="ml-1 inline scale-x-[-1] transform text-primary sm:ml-2"
              size={20}
            />
          </h2>
        </div>

        <div className="space-y-2">
          <h3 className="mb-2 scroll-m-20 text-base font-semibold tracking-tight animate-in fade-in zoom-in sm:text-xl md:text-2xl">
            This video cannot be embedded. Click the button to open a new tab in
            YouTube.
          </h3>
          <Button
            type="button"
            className="w-fit self-center animate-in fade-in zoom-in text-sm sm:text-base"
            onClick={() => openYouTubeTab()}
          >
            Play in YouTube
            <Youtube className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="mt-2">
            <Button
              className="animate-in fade-in zoom-in"
              variant={"secondary"}
              type="button"
              onClick={() => {
                onPlayerEnd();
              }}
            >
              <SkipForward className="mr-2 h-5 w-5" />
              Skip
            </Button>
          </div>
        </div>

        <div className="relative flex w-full basis-1/4 items-end text-center">
          <div className="hidden sm:block">
            <QrCode url={joinPartyUrl} />
          </div>
          <a
            href={joinPartyUrl}
            target="_blank"
            className="font-mono text-xs text-white pl-2 sm:text-lg sm:pl-4 md:text-xl"
          >
            {joinPartyUrl.split("//")[1]}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-0 h-full">
      <YouTube
        key={video.id}
        loading="eager"
        // className={`h-full w-full`}
        className={`h-full w-full animate-in fade-in ${isReady ? "visible" : "invisible"
          }`}
        iframeClassName="w-full h-full"
        // iframeClassName="p2 fixed bottom-0 right-0 h-auto min-h-full w-auto min-w-full"
        videoId={video.id}
        opts={opts}
        onPlay={onPlayerPlay}
        onReady={onPlayerReady}
        onPause={onPlayerPause}
        onError={onPlayerError}
        onEnd={() => {
          onPlayerEnd();
        }}
      />
      <div
        className={cn(
          "absolute top-0 w-full text-center animate-in fade-in zoom-in",
          isPlaying ? "hidden" : "block"
        )}
      >
        <div
          className={`flex w-full flex-col items-center justify-center bg-black p-4 ${isReady ? "bg-opacity-80" : "bg-opacity-0"
            }`}
        >
          <h1 className="text-outline scroll-m-20 text-xl font-extrabold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            {decode(video.title)}
          </h1>
          <h2 className="text-outline scroll-m-20 text-lg font-bold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
            <MicVocal className="mr-1 inline text-primary sm:mr-2" size={20} />
            {video.singerName}
            <MicVocal
              className="ml-1 inline scale-x-[-1] transform text-primary sm:ml-2"
              size={20}
            />
          </h2>
        </div>

        {!isReady && (
          <div>
            <Spinner size={"large"} />
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-0 z-10 flex w-full flex-row justify-between px-2 sm:bottom-12 sm:px-4">
        <div className="hidden sm:block">
          <QrCode url={joinPartyUrl} />
        </div>

        <div
          className={`self-end p-1 sm:p-2 ${isPlaying && isFullscreen ? "hidden" : "block"
            }`}
        >
          <Button
            variant={"secondary"}
            type="button"
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => {
              onPlayerEnd();
            }}
          >
            <SkipForward className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
            Skip
          </Button>
          {/* <a
            href={joinPartyUrl}
            target="_blank"
            className="font-mono text-xl text-white"
          >
            {joinPartyUrl.split("//")[1]}
          </a> */}
        </div>
      </div>
    </div>
  );
}
