# Pilipino Yatai

![image](https://github.com/user-attachments/assets/45a1f009-d93a-487f-ada7-2b79b60dc416)

**Pilipino Yatai** is a modern, YouTube-based karaoke party web app. Host a party, let your friends join via QR code, and manage a shared queue where everyone gets a fair turn.

## 🎤 Key Features

- **Host a Party**: Create a private room and share it with friends.
- **Join via QR Code**: Seamlessly join from your mobile device to search and queue songs.
- **YouTube Search**: Integrated search to find any karaoke video on YouTube.
- **"Fairness" Queue**: Automatic reordering ensures no "mic hogs"—the queue balances turns between different singers.
- **Wireless Microphone (WebRTC)**: Use your phone as a wireless mic that streams audio directly to the host player.
- **Discover the Philippines**: An interactive slideshow experience exploring Filipino culture.
- **Sound Effects**: Trigger party sounds like the classic Airhorn.
- **PWA Ready**: Install it as a web app on your device.

## 🛠 Tech Stack

- **Frontend**: [Next.js 16 (Canary)](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Radix UI](https://www.radix-ui.com/)
- **Backend/API**: [tRPC](https://trpc.io/), [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Real-time / WebRTC**: [PartyKit](https://www.partykit.io/)
- **PWA**: [Serwist](https://serwist.pages.dev/)

## 🚀 Deployment

### 1. Database Setup
Ensure you have a PostgreSQL database (e.g., Supabase, Neon).
```bash
# Push the schema to your database
pnpm db:push
```

### 2. PartyKit Deployment
The real-time and WebRTC features require a PartyKit server.
```bash
# Deploy to PartyKit cloud
npx partykit deploy
```

### 3. Web Deployment (Vercel)
The Next.js app is optimized for Vercel.
1. Connect your repo to Vercel.
2. Add the environment variables from `.env.example`.
3. Set the `NEXT_PUBLIC_PARTYKIT_URL` to your deployed PartyKit host.

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```
2. **Setup environment**:
   Copy `.env.example` to `.env` and fill in your `YOUTUBE_API_KEY` and `DATABASE_URL`.
3. **Run servers**:
   ```bash
   # Starts both PartyKit and Next.js dev servers
   pnpm dev
   ```

## 🤝 Credits & Contribution

This project is a fork and evolution of:
- [empz/my-karaoke-party](https://github.com/empz/my-karaoke-party) - The original karaoke party foundation.
- [suda/wireless-microphone](https://github.com/suda/wireless-microphone) - The WebRTC wireless microphone implementation.

Feel free to open PRs or issues. Live site: [mykaraoke.party](https://www.mykaraoke.party)
