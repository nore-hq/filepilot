"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

/**
 * Architecture — Enterprise Architecture & Security section.
 * Uses a bento-style grid of capabilities with pure CSS accents.
 * No icons — uses monospaced labels and geometric markers.
 */

interface Capability {
    tag: string;
    title: string;
    desc: string;
    accent: "full" | "outline" | "muted";
}

const capabilities: Capability[] = [
    {
        tag: "INFRASTRUCTURE",
        title: "Modern Cloud Architecture",
        desc: "We deploy on platforms like AWS and Vercel to construct highly available environments that support application scaling.",
        accent: "full",
    },
    {
        tag: "DEVELOPMENT",
        title: "Type-Safe Engineering",
        desc: "Implementation of type-safe development practices to ensure maintainability and reliability.",
        accent: "outline",
    },
    {
        tag: "SECURITY",
        title: "Data Protection First",
        desc: "We implement standard security protocols, including authentication and access controls, for secure data management.",
        accent: "full",
    },
    {
        tag: "INTEGRATION",
        title: "Custom API Ecosystems",
        desc: "Development of documented REST and GraphQL APIs to facilitate system integration.",
        accent: "muted",
    },
    {
        tag: "RELIABILITY",
        title: "Automated CI/CD Pipelines",
        desc: "Implementation of testing and staging environments to support continuous deployment practices.",
        accent: "muted",
    },
    {
        tag: "CAPABILITY",
        title: "AI & Automation Ready",
        desc: "Modular system design allowing for the integration of automation and machine learning components as required.",
        accent: "outline",
    },
];

const clipPathOuter = "polygon(30px 0, calc(100% - 30px) 0, 100% 30px, 100% calc(100% - 30px), calc(100% - 30px) 100%, 30px 100%, 0 calc(100% - 30px), 0 30px)";
const clipPathInner = "polygon(29px 0, calc(100% - 29px) 0, 100% 29px, 100% calc(100% - 29px), calc(100% - 29px) 100%, 29px 100%, 0 calc(100% - 29px), 0 29px)";

const Architecture = () => {
    const container = useRef<HTMLElement>(null);

    useGSAP(() => {
        gsap.fromTo(
            ".arch-card",
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: container.current,
                    start: "top 75%",
                    toggleActions: "play none none none",
                },
            }
        );
    }, { scope: container });

    return (
        <section
            ref={container}
            className="py-28 md:py-36 px-6 md:px-10 border-t border-noir/10 relative overflow-hidden"
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-16 md:mb-20">
                    <h2 className="text-xs uppercase tracking-[0.4em] font-black mb-4 text-tarantino">
                        Architecture & Security
                    </h2>
                    <p className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none max-w-5xl text-noir">
                        Scalable Infrastructure <br/>
                        <span className="text-noir/30">Architecture.</span>
                    </p>
                </div>

                {/* Bento Grid: Single Big Sci-Fi Box with Cyberpunk Partitions */}
                <div 
                    className="relative w-full p-[2px] bg-tarantino shadow-[0_0_40px_rgba(255,79,0,0.3)] transition-shadow duration-500 hover:shadow-[0_0_60px_rgba(255,79,0,0.5)]"
                    style={{ clipPath: clipPathOuter }}
                >
                    {/* The Grid forming the glowing partitions (gap is the border) */}
                    <div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2px] md:gap-[3px] bg-tarantino w-full h-full"
                        style={{ clipPath: clipPathInner }}
                    >
                        {capabilities.map((cap, i) => (
                            <div
                                key={i}
                                className="arch-card relative group bg-[#151515] hover:bg-[#1A1A1A] transition-colors duration-500 p-8 md:p-10 flex flex-col h-full overflow-hidden"
                            >
                                {/* Inner Cyberpunk Trace Pattern */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen" style={{ backgroundImage: "radial-gradient(circle at center, #FF4F00 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                                
                                {/* Hover Glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top,rgba(255,79,0,0.25),transparent_70%)] pointer-events-none" />

                                {/* Content */}
                                <div className="relative z-20">
                                    {/* Tag */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-2 h-2 bg-tarantino shadow-[0_0_10px_rgba(255,79,0,1)]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-parchment/60 group-hover:text-parchment transition-colors duration-300">
                                            {cap.tag}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight mb-4 text-parchment group-hover:text-tarantino transition-colors duration-300">
                                        {cap.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm font-medium leading-relaxed text-parchment/60 group-hover:text-parchment/90 transition-colors duration-300">
                                        {cap.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Architecture;
