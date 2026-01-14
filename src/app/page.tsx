import Image from "next/image";
import { CreateParty } from "../components/create-party";
import logo from "~/assets/jeepney-karaoke.jpg";
import Link from "next/link";


export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">

      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <Image
          src={logo}
          width={800}
          height={600}
          alt="Pilipino Yatai logo"
          priority={true}
          placeholder="blur"
          className="rounded-xl shadow-2xl"
        />

        <CreateParty />

        <div>
          <Link href="/discover" className="hover:underline">
            Discover the Philippines
          </Link>
          <span className="mx-2 text-gray-500">|</span>
          <Link href="/terms-of-service" className="hover:underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}
