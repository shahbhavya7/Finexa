import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
   <div className="flex flex-col items-center justify-center min-h-[100vh] px-4 text-center ">
  <h1 className="text-6xl font-extrabold bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500 bg-clip-text text-transparent mb-4 animate-gradient-slow">
    404
  </h1>
  <h2 className="text-2xl font-semibold text-cyan-700 mb-4">
    Page Not Found
  </h2>
  <p className="text-cyan-500 mb-8 max-w-md">
    Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
  </p>
  <Link href="/">
    <Button
      size="lg"
      className="bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500 text-white hover:brightness-105 px-6 shadow-md transition"
    >
      Return Home
    </Button>
  </Link>
</div>

  );
}