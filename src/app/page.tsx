import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-center p-24">
      <div className="font-bold">
        <Link href="https://github.com/Hazmatyre/wkm-mvp-frontend" target="_blank">
          Workmind Test Environment
        </Link>
      </div>
      <div className="flex gap-1">
        <span>Chat UI</span>
        <Link
          className="font-bold underline decoration-sky-500 decoration-2 hover:decoration-pink-500"
          href="/chat"
        >
          here
        </Link>
      </div>
      <p className="text-red-500 text-xs mt-5">This is a testing tool for Workmind agents and is not intended for production use.</p>
    </main>
  );
}