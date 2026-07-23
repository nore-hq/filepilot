"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const techItems = [
    { name: "REACT", category: "UI" },
    { name: "TYPESCRIPT", category: "LANGUAGE" },
    { name: "PYTHON", category: "LANGUAGE" },
    { name: "NODE", category: "RUNTIME" },
    { name: "DOCKER", category: "INFRA" },
    { name: "VERCEL", category: "DEPLOY" },
    { name: "CUDA", category: "GPU" },
    { name: "PYTORCH", category: "AI/ML" },
    { name: "TENSOR", category: "FLOW" },
];

const CLIP_OUTER = "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)";
const CLIP_INNER = "polygon(7px 0, calc(100% - 7px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0 calc(100% - 7px), 0 7px)";

const CyberBadge = ({ name, category }: { name: string, category: string }) => {
    return (
        <div className="relative group shrink-0 min-w-[220px]">
            {/* Outer Wrapper for Border (Chamfered Corners) */}
            <div 
                className="relative p-[1px] bg-tarantino/30 transition-colors duration-300 group-hover:bg-tarantino"
                style={{ clipPath: CLIP_OUTER }}
            >
                {/* Inner Content Box (Solid Parchment Background) */}
                <div 
                    className="relative flex items-end gap-3 px-6 py-4 bg-[#EBE7DF] group-hover:bg-tarantino transition-colors duration-300 w-full h-full cursor-crosshair"
                    style={{ clipPath: CLIP_INNER }}
                >
                    {/* Inner Cyberpunk Bracket Accents (Top Left & Bottom Right) */}
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-tarantino/50 group-hover:border-parchment/80 transition-colors" />
                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-tarantino/50 group-hover:border-parchment/80 transition-colors" />
                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-tarantino/50 group-hover:border-parchment/80 transition-colors" />
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-tarantino/50 group-hover:border-parchment/80 transition-colors" />

                    {/* Content */}
                    <span className="relative z-10 text-3xl font-black uppercase tracking-tighter text-noir group-hover:text-parchment transition-colors duration-300">
                        {name}
                    </span>
                    <span className="relative z-10 text-[9px] font-bold uppercase tracking-[0.2em] text-tarantino group-hover:text-parchment/80 transition-colors duration-300 mb-[4px]">
                        {category}
                    </span>
                </div>
            </div>
        </div>
    );
};

const TechStack = () => {
    const container = useRef<HTMLElement>(null);

    useGSAP(() => {
        // Infinite sliding marquee animation
        gsap.to(".tech-marquee-track", {
            xPercent: -50,
            repeat: -1,
            duration: 35, // Adjust speed here (higher = slower)
            ease: "linear",
        });
        
        // Initial reveal animation for the whole section
        gsap.fromTo(
            container.current,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 1,
                scrollTrigger: {
                    trigger: container.current,
                    start: "top 80%",
                }
            }
        );
    }, { scope: container });

    return (
        <section
            ref={container}
            className="py-16 md:py-24 relative overflow-hidden bg-parchment border-t border-noir/10"
        >
            {/* Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] bg-tarantino/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-tarantino/15 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                
                {/* Header - Cleaned up to look professional without blurry drop shadows */}
                <div className="px-6 md:px-10 mb-10 md:mb-12">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] font-black mb-3 text-tarantino">
                        Engineering Stack
                    </h2>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-[0.95] max-w-4xl text-noir">
                        We don&apos;t just pick tools — <br className="hidden md:block" />we master them.
                    </h3>
                </div>

                {/* Tech Marquee Container */}
                <div className="relative w-full overflow-hidden py-4">
                    {/* The animated track */}
                    <div className="tech-marquee-track flex whitespace-nowrap will-change-transform gap-4 md:gap-6 px-4 md:px-6 w-max">
                        {/* Render the list twice to create the seamless loop effect */}
                        {[...techItems, ...techItems].map((tech, i) => (
                            <CyberBadge key={i} name={tech.name} category={tech.category} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TechStack;
