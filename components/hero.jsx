"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

const HeroSection = () => {
  const imageRef = useRef(null);

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="pt-40 pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1
          className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500 
                 bg-clip-text text-transparent animate-gradient-slow leading-tight"
        >
          Manage Your Finances <br /> with Intelligence
        </h1>
        <p
          className="text-xl bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500 
                 bg-clip-text text-transparent animate-gradient-slow leading-tight mb-8 max-w-2xl mx-auto"
        >
          An AI-powered financial management platform that helps you track,
          analyze, and optimize your spending with real-time insights.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="px-8 bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500 text-white hover:brightness-105 shadow-sm transition"
            >
              Get Started
            </Button>
          </Link>

          <Button
            size="lg"
            variant="outline"
            className="px-8 border-cyan-600 text-cyan-600 hover:bg-cyan-900/10 transition"
            onClick={(e) => {
              e.preventDefault(); // prevent link navigation
              toast.warning("Demo coming soon 🚧");
            }}
          >
            Watch Demo
          </Button>
        </div>

        <div className="hero-image-wrapper mt-5 md:mt-0">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner2.png"
              width={1280}
              height={720}
              alt="Dashboard Preview"
              className="rounded-lg shadow-2xl border mx-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
