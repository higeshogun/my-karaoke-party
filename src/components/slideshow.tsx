"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";
import { Button } from "./ui/ui/button";

export interface Slide {
    src: string;
    alt: string;
}

interface SlideshowProps {
    slides: Slide[];
    autoPlayInterval?: number;
    autoPlay?: boolean;
    loop?: boolean;
}

export function Slideshow({
    slides,
    autoPlayInterval = 5000,
    autoPlay = true,
    loop = true,
}: SlideshowProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!autoPlay) return;

        const timer = setInterval(() => {
            nextSlide();
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [currentIndex, autoPlay, autoPlayInterval]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () =>
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const toggleFullScreen = async () => {
        if (!document.fullscreenElement) {
            await containerRef.current?.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    };

    const nextSlide = () => {
        if (!loop && currentIndex === slides.length - 1) return;

        setDirection(1);
        setCurrentIndex((prevIndex) =>
            prevIndex === slides.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevSlide = () => {
        if (!loop && currentIndex === 0) return;

        setDirection(-1);
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? slides.length - 1 : prevIndex - 1
        );
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
        }),
    };

    if (!slides || slides.length === 0) {
        return null;
    }

    const currentSlide = slides[currentIndex];

    if (!currentSlide) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full overflow-hidden bg-black"
        >
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                    }}
                    className="absolute h-full w-full"
                >
                    <div className="relative h-full w-full">
                        <Image
                            src={currentSlide.src}
                            alt={currentSlide.alt}
                            fill
                            className="object-contain"
                            priority
                        />
                        {/* Caption overlay */}
                        <div className="absolute bottom-0 w-full bg-black/50 p-2 text-center text-white backdrop-blur-sm sm:p-4">
                            <p className="text-sm font-medium sm:text-lg">{currentSlide.alt}</p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/20 text-white hover:bg-black/40 h-8 w-8 sm:left-4 sm:h-10 sm:w-10"
                onClick={prevSlide}
                disabled={!loop && currentIndex === 0}
            >
                <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/20 text-white hover:bg-black/40 h-8 w-8 sm:right-4 sm:h-10 sm:w-10"
                onClick={nextSlide}
                disabled={!loop && currentIndex === slides.length - 1}
            >
                <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10 rounded-full bg-black/20 text-white hover:bg-black/40 h-7 w-7 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
                onClick={toggleFullScreen}
            >
                {isFullscreen ? (
                    <Minimize className="h-4 w-4 sm:h-6 sm:w-6" />
                ) : (
                    <Maximize className="h-4 w-4 sm:h-6 sm:w-6" />
                )}
            </Button>

            <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:gap-2">
                {slides.map((_, index) => (
                    <div
                        key={index}
                        className={`h-1.5 w-1.5 rounded-full transition-colors sm:h-2 sm:w-2 ${index === currentIndex ? "bg-white" : "bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
