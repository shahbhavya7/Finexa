import React from "react";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";

const Header = async() => {
  // Check if the user is logged in and fetch user data
  const user = await checkUser();
  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src={"/logo5.png"}
            alt="Welth Logo"
            width={200}
            height={60}
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Navigation Links - Different for signed in/out users */}
        <div className="hidden md:flex items-center space-x-8">
          <SignedOut>
            <a href="#features" className="text-gray-600 hover:text-blue-600">
              Features
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600"
            >
              Testimonials
            </a>
          </SignedOut>
        </div>

        {/* Action Buttons */}
      <div className="flex items-center space-x-4">
  <SignedIn>
    <Link
      href="/dashboard"
      className="text-cyan-600 hover:text-cyan-700 flex items-center gap-2"
    >
      <Button variant="outline" className="border-cyan-600 text-cyan-600 hover:bg-cyan-900/10 transition">
        <LayoutDashboard size={18} />
        <span className="hidden md:inline">Dashboard</span>
      </Button>
    </Link>

    <a href="/transaction/create">
      <Button
        className="flex items-center gap-2 bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500 text-white hover:brightness-105 shadow-sm transition"
      >
        <PenBox size={18} />
        <span className="hidden md:inline">Add Transaction</span>
      </Button>
    </a>
  </SignedIn>

  <SignedOut>
    <SignInButton forceRedirectUrl="/dashboard">
      <Button
        variant="outline"
        className="border-cyan-600 text-cyan-600 hover:bg-cyan-900/10 transition"
      >
        Login
      </Button>
    </SignInButton>
  </SignedOut>

  <SignedIn>
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-10 h-10 ring-2 ring-cyan-500",
        },
      }}
    />
  </SignedIn>
</div>

      </nav>
    </header>
  )
}

export default Header