import { useState, useEffect, useRef } from "react";
import usePartySocket from "partysocket/react";

interface UseMicReceiverProps {
    roomId: string; // Typically "karaoke-main" or similar, but needs to match sender
}

import { env } from "~/env";

// Map from SenderID to PeerConnection
type PeerMap = Map<string, RTCPeerConnection>;


interface StreamData {
    id: string; // Connection/User ID
    stream: MediaStream;
    pc: RTCPeerConnection;
}

export function useMicReceiver({ roomId }: UseMicReceiverProps) {
    // Streams to render
    const [streams, setStreams] = useState<StreamData[]>([]);
    const peersRef = useRef<PeerMap>(new Map());

    const socket = usePartySocket({
        host: env.NEXT_PUBLIC_PARTYKIT_URL,
        room: roomId,
    });

    useEffect(() => {
        if (!socket) return;

        const onMessage = async (event: MessageEvent) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "mic:offer") {
                const senderId = msg.from;
                // Create new PeerConnection for this sender
                const peer = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                });

                peersRef.current.set(senderId, peer);

                peer.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.send(JSON.stringify({
                            type: "mic:candidate",
                            target: senderId,
                            payload: event.candidate,
                        }));
                    }
                };

                peer.ontrack = (event) => {
                    const stream = event.streams[0];
                    if (stream) {
                        setStreams((prev) => {
                            // Avoid duplicates
                            if (prev.find(s => s.id === senderId)) return prev;
                            return [...prev, { id: senderId, stream, pc: peer }];
                        });
                    }
                };

                // Handle cleanup
                peer.onconnectionstatechange = () => {
                    if (peer.connectionState === "disconnected" || peer.connectionState === "failed") {
                        setStreams(prev => prev.filter(s => s.id !== senderId));
                        peersRef.current.delete(senderId);
                    }
                };

                await peer.setRemoteDescription(new RTCSessionDescription(msg.payload));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);

                socket.send(JSON.stringify({
                    type: "mic:answer",
                    target: senderId,
                    payload: answer
                }));

            } else if (msg.type === "mic:candidate") {
                const senderId = msg.from;
                const peer = peersRef.current.get(senderId);
                if (peer) {
                    peer.addIceCandidate(new RTCIceCandidate(msg.payload)).catch(console.error);
                }
            }
        };

        socket.addEventListener("message", onMessage);
        return () => socket.removeEventListener("message", onMessage);
    }, [socket]);

    return { streams };
}
