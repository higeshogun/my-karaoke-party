import { useState, useEffect, useRef, useCallback } from "react";
import usePartySocket from "partysocket/react";

import { env } from "~/env";

interface UseMicSenderProps {
    roomId: string;
}

export function useMicSender({ roomId }: UseMicSenderProps) {
    const [isMicOn, setIsMicOn] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const socket = usePartySocket({
        host: env.NEXT_PUBLIC_PARTYKIT_URL,
        room: roomId,
        onMessage(event) {
            const msg = JSON.parse(event.data);
            if (msg.type === "mic:answer" && peerRef.current) {
                // When we get an answer, set remote description
                peerRef.current.setRemoteDescription(new RTCSessionDescription(msg.payload))
                    .catch(console.error);
            } else if (msg.type === "mic:candidate" && peerRef.current) {
                // When we get a candidate, add it
                peerRef.current.addIceCandidate(new RTCIceCandidate(msg.payload))
                    .catch(console.error);
            }
        },
    });

    const startMic = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Create Peer Connection
            const peer = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            peerRef.current = peer;

            // Add tracks
            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            // Handle ICE candidates
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.send(
                        JSON.stringify({
                            type: "mic:candidate",
                            payload: event.candidate,
                        })
                    );
                }
            };

            // Create Offer
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            // Send Offer
            socket.send(
                JSON.stringify({
                    type: "mic:offer",
                    payload: offer,
                })
            );

            setIsMicOn(true);
            setIsConnected(true);

            // Handle connection state changes for cleanup
            peer.onconnectionstatechange = () => {
                if (peer.connectionState === "disconnected" || peer.connectionState === "failed") {
                    setIsConnected(false);
                }
            };

        } catch (err) {
            console.error("Error starting mic:", err);
            setIsMicOn(false);
        }
    }, [socket]);

    const stopMic = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        setIsMicOn(false);
        setIsConnected(false);
    }, []);

    const toggleMic = useCallback(() => {
        if (isMicOn) {
            stopMic();
        } else {
            startMic();
        }
    }, [isMicOn, startMic, stopMic]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMic();
        };
    }, [stopMic]);

    return { isMicOn, toggleMic, isConnected };
}
