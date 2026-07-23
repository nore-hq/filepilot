"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const row1 = [
    "Stripe", "OpenAI", "Supabase", "Vercel", "AWS", "GitHub", "Cloudflare", "Docker", "Claude"
];
const row2 = [
    "Firebase", "Gemini", "Google Maps", "PostgreSQL", "Next.js", "Redis", "Figma", "Sentry", "Twilio"
];

const Ecosystem = () => {
    const container = useRef<HTMLElement>(null);

    useGSAP(() => {
        // Track 1 Animation
        gsap.to(".eco-track-1", {
            xPercent: -50,
            repeat: -1,
            duration: 45, // Slow
            ease: "linear",
        });

        // Track 2 Animation (Slower, not in sync)
        gsap.to(".eco-track-2", {
            xPercent: -50,
            repeat: -1,
            duration: 60, // Even slower
            ease: "linear",
        });

        // Initial Fade-in
        gsap.fromTo(
            container.current,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 1,
                scrollTrigger: {
                    trigger: container.current,
                    start: "top 85%",
                }
            }
        );
    }, { scope: container });

    const renderItem = (name: string, i: number) => (
        <div
            key={i}
            className="flex-shrink-0 w-[200px] md:w-[280px] flex items-center justify-center py-10 md:py-14 border-r border-white/10 group relative overflow-hidden cursor-crosshair"
        >
            {/* Hover background sweep */}
            <div className="absolute inset-0 bg-tarantino/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-0" />
            <span className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white/25 group-hover:text-parchment transition-colors duration-300 relative z-10">
                {name}
            </span>
        </div>
    );

    return (
        <section
            ref={container}
            className="py-20 md:py-28 bg-noir border-t-4 border-tarantino relative overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                {/* Label */}
                <div className="text-center mb-14 md:mb-16">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                        Integrated Ecosystem
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-parchment mt-3">
                        We build on platforms{" "}
                        <span className="text-tarantino">you already trust.</span>
                    </h2>
                </div>
            </div>

            {/* Platform Names Scrolling Rows */}
            <div className="w-full border-t border-white/10 relative">
                
                {/* Edge fade gradients for seamless loop effect */}
                <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-noir to-transparent z-20 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-noir to-transparent z-20 pointer-events-none" />

                {/* Row 1 */}
                <div className="flex border-b border-white/10 overflow-hidden w-full">
                    <div className="eco-track-1 flex whitespace-nowrap will-change-transform w-max">
                        {[...row1, ...row1].map((name, i) => renderItem(name, i))}
                    </div>
                </div>

                {/* Row 2 */}
                <div className="flex border-b border-white/10 overflow-hidden w-full">
                    <div className="eco-track-2 flex whitespace-nowrap will-change-transform w-max">
                        {[...row2, ...row2].map((name, i) => renderItem(name, i))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10">
                {/* Bottom note */}
                <div className="mt-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15">
                        Payment · AI · Database · Hosting · Cloud · Analytics · Mapping · Real-Time
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Ecosystem;
