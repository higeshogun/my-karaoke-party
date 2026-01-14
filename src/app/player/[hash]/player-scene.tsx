/* eslint-disable */
"use client";

import {
  readLocalStorageValue,
  useFullscreen,
  useHotkeys,
} from "@mantine/hooks";
import type { Party } from "@prisma/client";
import { ListPlus, Maximize, Minimize, SkipForward, X, Menu, ChevronDown } from "lucide-react";
import Image from "next/image";
import type { Message, KaraokeParty } from "party";
import usePartySocket from "partysocket/react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import useSound from "use-sound";
import { EmptyPlayer } from "~/components/empty-player";
import { Player } from "~/components/player";
import { SongSearch } from "~/components/song-search";
import { Button } from "~/components/ui/ui/button";
import { env } from "~/env";
import { getUrl } from "~/utils/url";
import { MicManager } from "~/components/mic-manager";
import { cn } from "~/lib/utils";

type Props = {
  party: Party;
  initialPlaylist: KaraokeParty;
};

export default function PlayerScene({ party, initialPlaylist }: Props) {
  const [playlist, setPlaylist] = useState<KaraokeParty["playlist"]>(
    initialPlaylist.playlist ?? [],
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [playHorn] = useSound("/sounds/buzzer.mp3");
  const lastHornTimeRef = useRef<number>(0);
  const togglePlayPauseRef = useRef<(() => void) | null>(null);

  // Throttled horn function
  const playThrottledHorn = () => {
    const now = Date.now();
    const timeSinceLastHorn = now - lastHornTimeRef.current;

    if (timeSinceLastHorn >= 5000) {
      // 5 seconds in milliseconds
      toast.success("Someone sent a horn!");
      playHorn();
      lastHornTimeRef.current = now;
    } else {
      console.log(
        `Horn throttled. Try again in ${Math.ceil((5000 - timeSinceLastHorn) / 1000)} seconds.`,
      );
    }
  };

  const socket = usePartySocket({
    host: env.NEXT_PUBLIC_PARTYKIT_URL,
    room: party.hash ?? "",
    onMessage(event) {
      // TODO: Improve type safety
      const eventData = JSON.parse(event.data);
      console.log(eventData);

      if (eventData.type === "horn") {
        playThrottledHorn();
      }

      if (Array.isArray(eventData)) {
        setPlaylist(eventData as KaraokeParty["playlist"]);
      }
    },
  });

  const { ref, toggle, fullscreen } = useFullscreen();

  const currentVideo = playlist.find((video) => !video.playedAt);
  const nextVideos = playlist.filter((video) => !video.playedAt);

  const addSong = (videoId: string, title: string, coverUrl: string) => {
    const singerName = readLocalStorageValue({
      key: "name",
      defaultValue: "Host",
    });

    socket.send(
      JSON.stringify({
        type: "add-video",
        id: videoId,
        title,
        singerName,
        coverUrl,
      } satisfies Message),
    );
  };

  const removeSong = (videoId: string) => {
    socket.send(
      JSON.stringify({
        type: "remove-video",
        id: videoId,
      } satisfies Message),
    );
  };

  const markAsPlayed = () => {
    if (currentVideo) {
      // setShowOpenInYouTubeButton(false);

      socket.send(
        JSON.stringify({
          type: "mark-as-played",
          id: currentVideo.id,
        } satisfies Message),
      );
    }
  };

  // Add keyboard shortcuts
  // f - fullscreen toggle, space - play/pause, right arrow - skip video
  useHotkeys([
    ["f", toggle],
    ["Space", () => togglePlayPauseRef.current?.()],
    [
      "ArrowRight",
      () => {
        if (currentVideo) {
          markAsPlayed();
        }
      },
    ],
  ]);

  const joinPartyUrl = getUrl(`/join/${party.hash}`);

  return (
    <div className="flex h-screen w-full flex-col bg-black md:flex-row md:flex-nowrap">
      <MicManager roomId={party.hash ?? ""} />

      {/* Mobile Header with Menu Toggle */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-black px-4 md:hidden">
        <h1 className="text-outline text-xl font-extrabold tracking-tight text-white">
          {party.name}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="h-10 w-10 text-white hover:bg-slate-800"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <ListPlus className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Song Search Overlay */}
      <div className={cn(
        "absolute left-0 top-14 z-50 flex w-full flex-col bg-black/95 backdrop-blur-md transition-all duration-300 md:hidden",
        isMobileMenuOpen ? "bottom-0 opacity-100" : "bottom-[100%] h-0 opacity-0 overflow-hidden"
      )}>
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="mb-4 text-xl font-bold text-white">Add Songs</h2>
          <SongSearch
            key={`${party.hash}-mobile`}
            playlist={playlist}
            onVideoAdded={(videoId, title, coverUrl) => {
              addSong(videoId, title, coverUrl);
              setIsMobileMenuOpen(false);
              toast.success("Song added to queue!");
            }}
          />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:grow-0 md:basis-1/3 overflow-y-auto border-r border-slate-500 px-4">
        <div className="py-4 text-center">
          <h1 className="text-outline scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
            {party.name}
          </h1>
        </div>
        <SongSearch
          key={party.hash}
          playlist={playlist}
          onVideoAdded={addSong}
        />
      </div>
      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:grow-0 md:basis-2/3">
        <div className="flex h-full flex-col">
          {/* Video Player */}
          <div className="relative shrink-0 border-b border-slate-800 bg-black/50 overflow-hidden h-[40vh] min-h-[220px] md:h-5/6 md:border-b-0" ref={ref}>
            <Button
              onClick={toggle}
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2 z-10 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 md:right-3"
            >
              {fullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
            </Button>
            {currentVideo ? (
              <Player
                key={currentVideo.id}
                video={currentVideo}
                joinPartyUrl={joinPartyUrl}
                isFullscreen={fullscreen}
                onPlayerEnd={() => {
                  markAsPlayed();
                }}
                onTogglePlayPauseRef={togglePlayPauseRef}
              />
            ) : (
              <EmptyPlayer
                joinPartyUrl={joinPartyUrl}
                className={fullscreen ? "bg-gradient" : ""}
              />
            )}
          </div>
          {/* Playlist Queue */}
          <div className="flex flex-1 flex-col overflow-hidden bg-slate-900/50 p-3 md:h-1/6 md:min-h-[150px] md:p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 md:hidden">
              Up Next ({nextVideos.length})
            </h3>
            {nextVideos.length > 0 ? (
              <>
                <div className="no-scrollbar flex h-full flex-row space-x-3 overflow-x-auto pb-2">
                  {nextVideos.map((v, i) => (
                    <div
                      key={v.id}
                      className="relative flex aspect-[4/3] h-full min-w-[140px] shrink-0 items-center justify-center rounded-lg bg-slate-800 p-0 text-center text-primary-foreground shadow-lg animate-in slide-in-from-bottom border border-slate-700 md:min-w-[100px] md:p-3"
                    >
                      <Image
                        src={v.coverUrl}
                        fill={true}
                        className="rounded-lg object-cover hover:opacity-50"
                        alt="Cover"
                      />

                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-1 top-1 z-10 h-7 w-7 rounded-full opacity-80 shadow-sm hover:opacity-100 md:h-8 md:w-8 md:right-0 md:top-0 md:rounded-md"
                        onClick={() => {
                          removeSong(v.id);
                        }}
                      >
                        <X className="h-4 w-4 text-white" />
                      </Button>

                      {i === 0 && (
                        <div className="absolute inset-0 z-0 rounded-lg ring-2 ring-amber-500 pointer-events-none" />
                      )}

                      {i === 0 && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute bottom-1 right-1 z-10 h-8 w-8 rounded-full opacity-90 shadow-sm hover:opacity-100 md:bottom-0 md:right-0 md:rounded-md"
                          onClick={() => {
                            markAsPlayed();
                          }}
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-700/50 bg-slate-900 p-4 text-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <ListPlus
                    size={24}
                    strokeWidth={1.5}
                    className="animate-bounce opacity-50"
                  />
                  <p className="text-sm">Queue is empty</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
