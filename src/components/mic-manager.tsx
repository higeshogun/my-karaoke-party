"use client";

import { useEffect, useRef, useState } from "react";
import { useMicReceiver } from "~/hooks/use-mic-receiver";
import { Mic, MicOff, Volume2, VolumeX, Play, Waves } from "lucide-react";
import { Button } from "./ui/ui/button";

const SILENCE_TIMEOUT_SECONDS = 40;

export function MicManager({ roomId }: { roomId: string }) {
    const { streams } = useMicReceiver({ roomId });
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1.0);
    const [reverb, setReverb] = useState(0.0);
    const [isReverbOn, setIsReverbOn] = useState(false); // Default to off to avoid "echo" confusion
    const [showControls, setShowControls] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Hidden start button if audio context needs user gesture
    const enableAudio = () => {
        setAudioEnabled(true);
    };

    return (
        <>
            {/* 1. Host Controls & Visuals (Visible + Audio) */}
            <div className="fixed top-16 right-2 z-50 flex flex-col items-end gap-2 text-white md:top-4 md:right-4">

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
                        <div className="flex items-center gap-2 w-48 mb-1">
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

                        {/* Reverb Control Row */}
                        <div className="flex items-center justify-between gap-2 w-48 mb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 hover:bg-white/20 ${isReverbOn ? 'text-blue-400' : 'text-gray-500'}`}
                                onClick={() => setIsReverbOn(!isReverbOn)}
                                title={isReverbOn ? "Turn Reverb Off" : "Turn Reverb On"}
                            >
                                <Waves size={16} />
                            </Button>

                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={reverb}
                                onChange={(e) => {
                                    setReverb(parseFloat(e.target.value));
                                    if (!isReverbOn) setIsReverbOn(true); // Auto-enable on slide
                                }}
                                disabled={!isReverbOn}
                                className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isReverbOn ? 'bg-gray-600 accent-blue-500' : 'bg-gray-800 accent-gray-600'}`}
                                title={`Reverb: ${Math.round(reverb * 100)}%`}
                            />
                            <span className={`text-xs w-8 text-right ${isReverbOn ? 'text-gray-400' : 'text-gray-600'}`}>
                                {Math.round(reverb * 100)}%
                            </span>
                        </div>

                        {/* Per-Stream Logic & Visuals Combined */}
                        {streams.length > 0 && (
                            <div className="flex flex-col gap-1 w-full border-t border-gray-700 pt-2">
                                {streams.map((s) => (
                                    <MicStreamController
                                        key={s.id}
                                        data={s}
                                        muted={isMuted}
                                        volume={volume}
                                        reverb={reverb}
                                        isReverbOn={isReverbOn}
                                        audioEnabled={audioEnabled}
                                        onPlayError={() => setAudioEnabled(false)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

// Combined Component: Audio Processing, Reverb, AND Visuals
function MicStreamController({
    data,
    muted,
    volume,
    reverb,
    isReverbOn,
    audioEnabled,
    onPlayError,
    isVisualOnly = false, // New prop to control rendering of audio elements
}: {
    data: { id: string, stream: MediaStream, pc: RTCPeerConnection };
    muted: boolean;
    volume: number;
    reverb: number;
    isReverbOn: boolean;
    audioEnabled: boolean;
    onPlayError: () => void;
    isVisualOnly?: boolean;
}) {
    // Refs for Audio Processing
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null); // For dry signal
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const wetGainRef = useRef<GainNode | null>(null);
    const convolverRef = useRef<ConvolverNode | null>(null);

    // Refs for Visuals
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameIdRef = useRef<number>(); // Renamed from requestRef for clarity

    // Stats State
    const [rtt, setRtt] = useState<number | null>(null);
    const [isSilent, setIsSilent] = useState(false);
    const silenceStartRef = useRef<number | null>(null);
    const [silenceDuration, setSilenceDuration] = useState(0);
    const [audioReady, setAudioReady] = useState(false); // Triggers connection logic once graph is built

    // 1. Native Audio (Dry Signal) - Zero Latency
    // Only run if not in visual-only mode
    useEffect(() => {
        if (isVisualOnly) return;

        if (audioRef.current) {
            audioRef.current.srcObject = data.stream;
            audioRef.current.play().catch((e) => {
                console.error("Audio play failed", e);
                onPlayError();
            });
        }
    }, [data.stream, onPlayError, isVisualOnly]);

    // Handle Dry Volume / Mute
    useEffect(() => {
        if (isVisualOnly) return;
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : volume;
        }
    }, [volume, muted, isVisualOnly]);

    // 2. Web Audio (Reverb + Visuals)
    useEffect(() => {
        if (!audioEnabled) return;

        const initAudio = async () => {
            try {
                // Use 'interactive' latency hint
                const Ctx = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new Ctx({ latencyHint: 'interactive' });
                audioCtxRef.current = ctx;

                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }

                const source = ctx.createMediaStreamSource(data.stream);
                const wetGain = ctx.createGain();
                const convolver = ctx.createConvolver();
                const analyser = ctx.createAnalyser();

                // Reverb Chain
                convolver.buffer = createReverbImpulse(ctx, 2.0, 2.0);

                // Route: Source -> Analyzer (Visuals) -> NOWHERE (Just analysis)
                source.connect(analyser); // For visuals

                // Only connect reverb path if not in visual-only mode
                if (!isVisualOnly) {
                    // Source -> Convolver (Reverb) -> WetGain
                    source.connect(convolver);
                    convolver.connect(wetGain);
                    // DO NOT connect wetGain -> destination here.
                    // Let the connection effect handle it based on state.
                }

                // Config Analyser
                analyser.fftSize = 32;

                // Save Refs
                sourceRef.current = source;
                wetGainRef.current = wetGain;
                convolverRef.current = convolver;
                analyserRef.current = analyser;

                setAudioReady(true);

            } catch (e) {
                console.error("Audio init failed", e);
            }
        };

        void initAudio();

        return () => {
            setAudioReady(false);
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(console.error);
            }
        };
    }, [data.stream, audioEnabled, isVisualOnly]);

    // 3. Animation Loop (Visuals)
    useEffect(() => {
        const analyser = analyserRef.current;
        if (!analyser) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!canvasRef.current || !analyser) {
                animationFrameIdRef.current = requestAnimationFrame(draw); // Keep trying if canvas not ready
                return;
            }

            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] ?? 0;
            }
            const average = sum / bufferLength;

            // Stats Logic
            if (average < 10) {
                if (silenceStartRef.current === null) silenceStartRef.current = Date.now();
                const dur = (Date.now() - silenceStartRef.current) / 1000;
                setSilenceDuration(dur);
                setIsSilent(true);
                if (dur > SILENCE_TIMEOUT_SECONDS) data.pc.close(); // Auto Close
            } else {
                silenceStartRef.current = null;
                setSilenceDuration(0);
                setIsSilent(false);
            }

            // Draw Logic
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                const barWidth = (average / 255) * canvasRef.current.width;
                ctx.fillStyle = average > 10 ? '#4ade80' : '#f87171';
                ctx.fillRect(0, 0, barWidth, canvasRef.current.height);
            }

            animationFrameIdRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        }
    }, [analyserRef.current, data.pc]); // Re-bind if analyser changes or pc changes for auto-close logic

    // 4. Update Reverb Params & Connection State
    // Only run if not in visual-only mode
    useEffect(() => {
        if (isVisualOnly) return;
        if (!audioCtxRef.current || !wetGainRef.current) return;

        const ctx = audioCtxRef.current;
        const wetGain = wetGainRef.current;
        const now = ctx.currentTime;

        const shouldBeWet = !muted && (isReverbOn && reverb > 0);

        if (shouldBeWet) {
            // Calculate wet value (linear ramp for smoothness)
            const wetVal = volume * reverb * 1.5;

            // Ensure connection to destination
            try {
                // Check if already connected? Only way is try/catch or tracking state.
                // We will blindly connect. connect() to same node multiple times is ignored/safe in WebAudio (mostly).
                // Actually it creates fan-in. We should track it.
                // But wait, we initialized it connected.
            } catch (e) { }

            wetGain.gain.setTargetAtTime(wetVal, now, 0.1);
        } else {
            // Fade out then maybe disconnect? rather just gain 0 for now, 
            // but user reported echo at gain 0.
            // Let's try explicit disconnect after fade.
            wetGain.gain.setTargetAtTime(0, now, 0.1);
        }
    }, [volume, reverb, muted, isReverbOn, isVisualOnly]);

    // Strict Connection Management
    const isWetConnected = useRef(false); // Initially disconnected

    useEffect(() => {
        if (isVisualOnly || !audioReady || !audioCtxRef.current || !wetGainRef.current) return;
        const wetGain = wetGainRef.current;
        const ctx = audioCtxRef.current;

        const shouldConnect = !muted && isReverbOn && reverb > 0;

        if (shouldConnect && !isWetConnected.current) {
            wetGain.connect(ctx.destination);
            isWetConnected.current = true;
        } else if (!shouldConnect && isWetConnected.current) {
            // Disconnect with small delay to avoid clicks, or immediate if user wants strict cut
            wetGain.disconnect(ctx.destination);
            isWetConnected.current = false;
        }
    }, [muted, isReverbOn, reverb, isVisualOnly, audioReady]);

    // 5. Stats Polling
    useEffect(() => {
        const getStats = async () => {
            try {
                const stats = await data.pc.getStats();
                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        setRtt(report.currentRoundTripTime * 1000);
                    }
                });
            } catch (e) { console.error(e); }
        };
        const id = setInterval(getStats, 2000);
        return () => clearInterval(id);
    }, [data.pc]);

    return (
        <div className="flex justify-between items-center text-xs text-gray-300">
            {/* Use hidden audio for dry signal, only if not visual-only */}
            {!isVisualOnly && (
                <audio ref={audioRef} autoPlay playsInline muted={muted} className="hidden" />
            )}

            <div className="flex items-center gap-2">
                <canvas ref={canvasRef} width={40} height={8} className="bg-gray-700 rounded-sm" />
                <span className="font-mono">{data.id.slice(0, 4)}</span>
            </div>

            <div className="flex items-center gap-2">
                {isSilent && silenceDuration > 5 && (
                    <span className="text-[10px] text-red-500 animate-pulse">
                        Closing in {(SILENCE_TIMEOUT_SECONDS - silenceDuration).toFixed(0)}s
                    </span>
                )}
                <span className="w-8 text-right text-gray-500">
                    {rtt ? `${rtt.toFixed(0)}ms` : '--'}
                </span>
            </div>
        </div>
    );
}

// Helper: Create Simple Reverb Impulse
function createReverbImpulse(audioCtx: AudioContext, duration: number, decay: number) {
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioCtx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i; // sample index
        // Exponential decay
        const val = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        left[i] = val;
        right[i] = val;
    }

    return impulse;
}
