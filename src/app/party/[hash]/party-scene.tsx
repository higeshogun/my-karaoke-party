/* eslint-disable */
"use client";

import type { Party } from "@prisma/client";
import type { Message, KaraokeParty } from "party";
import usePartySocket from "partysocket/react";
import { useEffect, useState } from "react";
import { env } from "~/env";
import { readLocalStorageValue, useLocalStorage } from "@mantine/hooks";
import { SongSearch } from "~/components/song-search";
import { ListMusic, Megaphone, Mic, MicOff } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/ui/accordion";
import { decode } from "html-entities";
import { useRouter } from "next/navigation";
import { useMicSender } from "~/hooks/use-mic-sender";

export function PartyScene({
  party,
  initialPlaylist,
}: {
  party: Party;
  initialPlaylist?: KaraokeParty;
}) {
  const [name] = useLocalStorage<string>({ key: "name" });
  const router = useRouter();

  const { isMicOn, toggleMic, isConnected } = useMicSender({ roomId: party.hash ?? "" });


  const [playlist, setPlaylist] = useState<KaraokeParty["playlist"]>(
    initialPlaylist?.playlist ?? [],
  );

  useEffect(() => {
    const value = readLocalStorageValue({ key: "name" });

    if (!value) {
      router.push(`/join/${party.hash}`);
    }
  }, [router, party.hash]);

  const socket = usePartySocket({
    host: env.NEXT_PUBLIC_PARTYKIT_URL,
    room: party.hash ?? "",
    // onOpen(_event) {
    //   if (name) {
    //     socket.send(
    //       JSON.stringify({
    //         type: "join",
    //         name,
    //       }),
    //     );
    //   }
    // },
    onMessage(event) {
      try {
        const eventData = JSON.parse(event.data);

        if (eventData.type === "horn") {
          // toast.success("You sent a horn!");
          // playHorn(); // Play the horn sound
          // return;
        }

        // If it's an array, it's the playlist update
        if (Array.isArray(eventData)) {
          setPlaylist(eventData);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    },
  });

  const addSong = async (videoId: string, title: string, coverUrl: string) => {
    socket.send(
      JSON.stringify({
        type: "add-video",
        id: videoId,
        title,
        singerName: name,
        coverUrl,
      } satisfies Message),
    );
  };

  const sendHorn = async () => {
    socket.send(
      JSON.stringify({
        type: "horn",
      } satisfies Message)
    );
  }

  const nextVideos = playlist.filter((video) => !video.playedAt);
  const nextVideo = nextVideos[0] ?? null;

  return (
    <>
      <div className="container mx-auto p-6 pb-16 text-center">
        <div>
          <h1 className="text-outline scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
            {party.name}
          </h1>
        </div>

        <div className="mt-5">
          <SongSearch onVideoAdded={addSong} playlist={playlist} />
        </div>
      </div>

      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-4">
        <button
          type="button"
          className="rounded-full bg-yellow-200 p-3 text-black hover:text-white hover:bg-red-700 shadow-xl border-2 border-transparent hover:border-white transition-all"
          onClick={sendHorn}
          title="Send Horn"
        >
          <Megaphone size={24} />
        </button>

        <button
          type="button"
          className={`rounded-full p-3 text-white shadow-xl transition-all border-2 ${isMicOn
            ? "bg-red-500 animate-pulse border-red-300"
            : "bg-blue-600 hover:bg-blue-700 border-transparent hover:border-white"
            }`}
          onClick={toggleMic}
          title="Toggle Mic"
        >
          {isMicOn ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>

      <div className="fixed bottom-0 z-50 flex flex-col w-full items-center bg-primary p-2 text-primary-foreground text-white">
        <Accordion type="single" collapsible className="max-h-screen w-full">
          <AccordionItem value="item-1" className="border-0">
            <AccordionTrigger disabled={nextVideos.length < 2}>
              <div className="flex flex-row">
                <ListMusic className="mr-3" />
                {nextVideo ? nextVideo.title : "Playlist is empty"}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="divide-y divide-accent-foreground">
                {nextVideos.slice(1).map((video) => (
                  <li key={video.id} className="p-2 first:pt-0 last:pb-0">
                    {decode(video.title)}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}
