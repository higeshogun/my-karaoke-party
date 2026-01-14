"use client";

import Link from "next/link";
import { ButtonHoverGradient } from "~/components/ui/ui/button-hover-gradient";
import { ArrowLeft } from "lucide-react";

import { Slideshow } from "~/components/slideshow";

const slides = [
    {
        src: "/slides/slide1.png",
        alt: "Discover the Philippines - Slide 1",
    },
    {
        src: "/slides/slide2.png",
        alt: "Discover the Philippines - Slide 2",
    },
    {
        src: "/slides/slide3.png",
        alt: "Discover the Philippines - Slide 3",
    },
    {
        src: "/slides/slide4.png",
        alt: "Discover the Philippines - Slide 4",
    },
    {
        src: "/slides/slide5.png",
        alt: "Discover the Philippines - Slide 5",
    },
    {
        src: "/slides/slide6.png",
        alt: "Discover the Philippines - Slide 6",
    },
    {
        src: "/slides/slide7.png",
        alt: "Discover the Philippines - Slide 7",
    },
    {
        src: "/slides/slide8.png",
        alt: "Discover the Philippines - Slide 8",
    },
    {
        src: "/slides/slide9.png",
        alt: "Discover the Philippines - Slide 9",
    },
];

export default function DiscoverPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-start bg-black px-3 py-6 text-white sm:px-4 sm:py-8 md:justify-center">
            <div className="container flex w-full max-w-6xl flex-col items-center gap-4 sm:gap-6 md:gap-8">
                <div className="flex w-full items-center justify-start">
                    <Link href="/">
                        <ButtonHoverGradient className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Party
                        </ButtonHoverGradient>
                    </Link>
                </div>

                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 text-center sm:text-3xl md:text-4xl">
                    Discover the Philippines
                </h1>

                <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-2xl border border-white/20 sm:rounded-xl sm:border-2">
                    <Slideshow slides={slides} />
                </div>

                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mt-4 text-center sm:text-2xl sm:mt-6 md:text-3xl md:mt-8">
                    Featured Videos
                </h2>

                <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-2xl border border-white/20 sm:rounded-xl sm:border-2">
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/videoseries?list=PLjJeD2qsshyGCRAZL5kpfhUE26Fkkflu2"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                    ></iframe>
                </div>

                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600 mt-4 text-center sm:text-2xl sm:mt-6 md:text-3xl md:mt-8">
                    OPM & Pinoy Rock
                </h2>

                <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">
                    <div className="flex flex-col gap-2 sm:gap-4">
                        <h3 className="text-lg font-semibold text-white sm:text-xl">OPM Favorites</h3>
                        <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-2xl border border-white/20 sm:rounded-xl sm:border-2">
                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/videoseries?list=PLiy0XOfUv4hEQ_aBtfoT_XCCYia7jSpxo"
                                title="OPM Favorites Playlist"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full"
                            ></iframe>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-4">
                        <h3 className="text-lg font-semibold text-white sm:text-xl">
                            Pinoy Rock Essentials
                        </h3>
                        <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-2xl border border-white/20 sm:rounded-xl sm:border-2">
                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/videoseries?list=PLiy0XOfUv4hGbDDI0gx6sFqsYdcQ6zMWx"
                                title="Pinoy Rock Essentials Playlist"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
