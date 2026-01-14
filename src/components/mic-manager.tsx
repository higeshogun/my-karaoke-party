"use client";

import { useEffect, useRef, useState } from "react";
import { useMicReceiver } from "~/hooks/use-mic-receiver";
import { Mic, MicOff, Volume2, VolumeX, Play } from "lucide-react";
import { Button } from "./ui/ui/button";

export function MicManager({ roomId }: { roomId: string }) {
    const { streams } = useMicReceiver({ roomId });
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1.0);
    const [showControls, setShowControls] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Hidden start button if audio context needs user gesture
    const enableAudio = () => {
        setAudioEnabled(true);
    };

    return (
        <>
            {/* 1. Audio Processing (Hidden but rendered for sound) */}
            <div className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden">
                {streams.map((s) => (
                    <MicAudioPlayback
                        key={s.id}
                        data={s}
                        muted={isMuted}
                        volume={volume}
                        onPlayError={() => setAudioEnabled(false)}
                    />
                ))}
            </div>

            {/* 2. Host Controls & Visuals (Visible) */}
            <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 text-white">

                {/* Audio Enable Button (if needed) */}
                {(!audioEnabled && streams.length > 0) && (
                    <Button
                        onClick={enableAudio}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black animate-bounce shadow-xl mb-2"
                    >
                        <Play className="mr-2 h-4 w-4" /> Unmute / Enable Audio
                    </Button>
                )}

                {/* Main Control Panel */}
                {(showControls || streams.length > 0) && (
                    <div className="flex flex-col gap-2 rounded-lg bg-black/80 p-3 shadow-xl backdrop-blur-md border border-white/10 transition-all hover:bg-black/90">

                        {/* Header: Count & Global Mute */}
                        <div className="flex items-center justify-between gap-4 mb-1">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    {streams.length > 0 ? (
                                        <>
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </>
                                    ) : (
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    )}
                                </span>
                                <span className="text-sm font-bold">
                                    {streams.length > 0 ? `${streams.length} Mic(s) Live` : 'No Mics'}
                                </span>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 hover:bg-white/20 text-white ${isMuted ? 'text-red-400' : ''}`}
                                onClick={() => setIsMuted(!isMuted)}
                                title={isMuted ? "Unmute Mics" : "Mute Mics"}
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </Button>
                        </div>

                        {/* Global Volume Slider */}
                        <div className="flex items-center gap-2 w-48 mb-2">
                            <Volume2 size={14} className="text-gray-400" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                                title={`Mic Volume: ${Math.round(volume * 100)}%`}
                            />
                            <span className="text-xs text-gray-400 w-8 text-right">{Math.round(volume * 100)}%</span>
                        </div>

                        {/* Per-Stream Visuals & Stats */}
                        {streams.length > 0 && (
                            <div className="flex flex-col gap-1 w-full border-t border-gray-700 pt-2">
                                {streams.map((s) => (
                                    <MicStreamStats key={s.id} data={s} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

// Component 1: Handles Audio Playback (Hidden)
function MicAudioPlayback({
    data,
    muted,
    volume,
    onPlayError
}: {
    data: { id: string, stream: MediaStream };
    muted: boolean;
    volume: number;
    onPlayError: () => void;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.srcObject = data.stream;
            audioRef.current.play().catch((e) => {
                console.error("Audio play failed", e);
                onPlayError();
            });
        }
    }, [data.stream, onPlayError]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    return (
        <audio
            ref={audioRef}
            autoPlay
            playsInline
            muted={muted}
        />
    );
}

// Component 2: Handles Visuals & Stats (Visible)
function MicStreamStats({
    data
}: {
    data: { id: string, stream: MediaStream, pc: RTCPeerConnection };
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rtt, setRtt] = useState<number | null>(null);
    const [isSilent, setIsSilent] = useState(false);

    // Auto-disconnect logic
    const silenceStartRef = useRef<number | null>(null);
    const [silenceDuration, setSilenceDuration] = useState(0);

    useEffect(() => {
        if (!data.stream || !data.pc) return;

        let animationFrameId: number;
        let statsIntervalId: NodeJS.Timeout;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(data.stream);

        source.connect(analyser);
        analyser.fftSize = 32;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Visualizer Loop
        const draw = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] ?? 0;
            }
            const average = sum / bufferLength;

            // Silence Detection (Threshold ~10 out of 255)
            if (average < 10) {
                if (silenceStartRef.current === null) {
                    silenceStartRef.current = Date.now();
                }
                const duration = (Date.now() - silenceStartRef.current) / 1000;
                setSilenceDuration(duration);
                setIsSilent(true);

                // Auto-Disconnect Logic
                if (duration > 20) {
                    data.pc.close();
                }

            } else {
                silenceStartRef.current = null;
                setSilenceDuration(0);
                setIsSilent(false);
            }

            // Draw to canvas
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // Draw a simple bar
                    const barWidth = (average / 255) * canvas.width;

                    ctx.fillStyle = average > 10 ? '#4ade80' : '#f87171'; // Green or Red
                    ctx.fillRect(0, 0, barWidth, canvas.height);
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        // Stats Polling
        const getStats = async () => {
            try {
                const stats = await data.pc.getStats();
                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        setRtt(report.currentRoundTripTime * 1000);
                    }
                });
            } catch (e) {
                console.error("Error getting stats:", e);
            }
        };
        statsIntervalId = setInterval(getStats, 2000);

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearInterval(statsIntervalId);
            if (audioCtx.state !== 'closed') audioCtx.close();
        };

    }, [data.stream, data.pc]);

    return (
        <div className="flex justify-between items-center text-xs text-gray-300">
            <div className="flex items-center gap-2">
                {/* Horizontal Bar Visualizer */}
                <canvas ref={canvasRef} width={40} height={8} className="bg-gray-700 rounded-sm" />
                <span className="font-mono">{data.id.slice(0, 4)}</span>
            </div>

            <div className="flex items-center gap-2">
                {isSilent && silenceDuration > 5 && (
                    <span className="text-[10px] text-red-500 animate-pulse">
                        Closing in {(20 - silenceDuration).toFixed(0)}s
                    </span>
                )}
                <span className="w-8 text-right text-gray-500">
                    {rtt ? `${rtt.toFixed(0)}ms` : '--'}
                </span>
            </div>
        </div>
    );
}
