"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Ensure GSAP registers the plugin only on the client side
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface Step {
    num: string;
    title: string;
    desc: string;
}

const steps: Step[] = [
    {
        num: "01",
        title: "Discovery & Strategy",
        desc: "We begin by analyzing your core business objectives and technical requirements to establish a comprehensive project roadmap."
    },
    {
        num: "02",
        title: "Custom Architecture",
        desc: "Our engineers develop secure and scalable solutions tailored to operational requirements."
    },
    {
        num: "03",
        title: "Agile Deployment",
        desc: "We develop using agile methodologies and continuous integration to incorporate feedback efficiently."
    }
];

const Process = () => {
    const containerRef = useRef<HTMLElement>(null);
    const stickyRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // NO PIN — use the tall container (300vh) as the scroll distance.
        // CSS sticky keeps the visible content in the viewport.
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
            }
        });

        // 1. Animate the timeline track and the glowing dot
        tl.to(".progress-line", { scaleX: 1, ease: "none", duration: 30 }, 0);
        tl.to(".glowing-dot", { left: "100%", ease: "none", duration: 30 }, 0);

        // 2. Initial state for the text blocks
        gsap.set(".step-0", { opacity: 1, y: 0 });
        gsap.set(".step-1", { opacity: 0, y: 40 });
        gsap.set(".step-2", { opacity: 0, y: 40 });

        // 3. Crossfade Step 0 -> Step 1
        tl.to(".step-0", { opacity: 0, y: -40, duration: 4, ease: "power2.inOut" }, 8);
        tl.to(".step-1", { opacity: 1, y: 0, duration: 4, ease: "power2.out" }, 12);

        // 4. Crossfade Step 1 -> Step 2
        tl.to(".step-1", { opacity: 0, y: -40, duration: 4, ease: "power2.inOut" }, 18);
        tl.to(".step-2", { opacity: 1, y: 0, duration: 4, ease: "power2.out" }, 22);

    }, { scope: containerRef });

    return (
        // The tall container provides scroll distance (replaces pin + end: "+=2500")
        <section 
            id="process" 
            ref={containerRef} 
            className="bg-noir text-parchment relative z-20"
            style={{ height: '300vh' }}
        >
            {/* Sticky inner keeps content visible while scrolling through the tall container */}
            <div 
                ref={stickyRef}
                className="sticky top-0 h-screen w-full flex flex-col justify-center pt-24 pb-8 px-6 md:px-10 max-w-7xl mx-auto"
            >
                
                {/* Header Area */}
                <div className="mb-10 md:mb-14">
                    <h2 className="text-xs uppercase tracking-[0.4em] font-black mb-4 text-tarantino">
                        How We Work
                    </h2>
                    <p className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter max-w-4xl leading-none">
                        We engineer scalable software solutions
                        <span className="text-white/30 block md:inline"> for long-term viability.</span>
                    </p>
                </div>

                {/* The Timeline Animation Area */}
                <div className="relative w-full">
                    
                    {/* The Track */}
                    <div className="relative w-full h-[2px] bg-white/10 rounded-full mb-10 md:mb-12">
                        {/* Static Nodes marking the 3 steps */}
                        <div className="absolute top-1/2 left-0 w-2 h-2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white/20 z-0"></div>
                        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white/20 z-0"></div>
                        <div className="absolute top-1/2 left-full w-2 h-2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white/20 z-0"></div>

                        {/* Animated Progress Line */}
                        <div className="progress-line absolute top-0 left-0 w-full h-full bg-tarantino origin-left scale-x-0 z-10"></div>

                        {/* Animated Glowing Dot */}
                        <div className="glowing-dot absolute top-1/2 left-0 w-4 h-4 bg-tarantino rounded-full -translate-y-1/2 -translate-x-1/2 shadow-[0_0_20px_4px_rgba(255,79,0,0.6)] z-20">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                    </div>

                    {/* The Crossfading Content */}
                    <div className="relative h-[180px] md:h-[200px] w-full">
                        {steps.map((step, i) => (
                            <div 
                                key={i} 
                                className={`step-${i} absolute inset-0 w-full flex flex-col md:flex-row gap-4 md:gap-16 opacity-0 pointer-events-none`}
                            >
                                <div className="md:w-1/3">
                                    <span className="text-tarantino font-black tracking-widest text-lg md:text-2xl block mb-2">
                                        {step.num}
                                    </span>
                                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-parchment">
                                        {step.title}
                                    </h3>
                                </div>
                                <div className="md:w-2/3 flex items-start md:items-center">
                                    <p className="text-white/60 leading-relaxed font-medium text-base md:text-xl lg:text-2xl max-w-2xl">
                                        {step.desc}
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

export default Process;