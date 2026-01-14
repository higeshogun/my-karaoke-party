import "~/styles/globals.css";

import { TRPCReactProvider } from "~/trpc/react";

import { Roboto_Slab, Roboto_Mono } from "next/font/google";
import { type Metadata, type Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AxiomWebVitals } from "next-axiom";
import { Toaster } from "~/components/ui/ui/sonner";

const APP_NAME = "Pilipino Yatai";
const APP_DEFAULT_TITLE = "Pilipino Yatai";
const APP_TITLE_TEMPLATE = "%s - Pilipino Yatai";
const APP_DESCRIPTION = "Host a karaoke party with your friends!";

const roboto_slab = Roboto_Slab({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-slab",
});

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="synthwave"
      className={`theme-custom ${roboto_slab.variable} ${roboto_mono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-gradient min-h-screen">
        <TRPCReactProvider>{children}</TRPCReactProvider>
        {process.env.NODE_ENV !== "development" && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
        <AxiomWebVitals />
        <Toaster />
      </body>
    </html>
  );
}
