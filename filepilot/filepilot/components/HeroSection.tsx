"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Hero = () => {
    const container = useRef<HTMLElement>(null);
    const magneticButton = useRef<HTMLButtonElement>(null);

    // Human-readable configuration for title lines
    const titleLines = [
        { text: 'Precision', highlight: false },
        { text: 'Software', highlight: true },
        { text: 'Engineering.', highlight: false },
    ];

    // Extracted shared classes to keep JSX clean and DRY
    const titleClass = "line-span cyber-glitch text-[8.2vw] sm:text-6xl md:text-7xl lg:text-6xl xl:text-[4.5rem] font-bold leading-[0.9] uppercase inline-block whitespace-nowrap will-change-transform";

    useGSAP(() => {
        if (!container.current) return;
        const lines = container.current.querySelectorAll('.line-span');
        const tl = gsap.timeline({ delay: 0.1 });

        tl.fromTo(lines,
            { y: "110%", skewY: 7, opacity: 0 },
            { y: 0, skewY: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power4.out" }
        );

        // Trigger glitch effect after text lands
        tl.call(() => {
            lines.forEach(line => line.classList.add('glitching'));
            // Remove glitch after the animation plays (1.2s)
            setTimeout(() => {
                lines.forEach(line => line.classList.remove('glitching'));
            }, 1200);
        }, [], '+=0.05');

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const isMobile = window.innerWidth < 1024;
            if (isMobile) return; 

            const xPercent = (clientX / window.innerWidth - 0.5);
            const yPercent = (clientY / window.innerHeight - 0.5);

            lines.forEach((line, index) => {
                const depth = (index + 1) * 8; 
                gsap.to(line, {
                    x: xPercent * depth,
                    y: yPercent * (depth / 2),
                    rotateY: xPercent * 6,  
                    rotateX: -yPercent * 6, 
                    duration: 1,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            });

            gsap.to(".video-container", {
                x: -xPercent * 15,
                y: -yPercent * 15,
                rotateY: -xPercent * 6,
                rotateX: yPercent * 6,
                duration: 1.2,
                ease: "power2.out"
            });
        };

        const handleMagnetic = (e: MouseEvent) => {
            if (window.innerWidth < 1024) return;
            const btn = magneticButton.current;
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - (rect.left + rect.width / 2);
            const y = e.clientY - (rect.top + rect.height / 2);
            gsap.to(btn, { x: x * 0.35, y: y * 0.35, duration: 0.4 });
        };

        const resetMagnetic = () => {
            gsap.to(magneticButton.current, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
        };

        window.addEventListener('mousemove', handleMouseMove);
        magneticButton.current?.addEventListener('mousemove', handleMagnetic);
        magneticButton.current?.addEventListener('mouseleave', resetMagnetic);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            magneticButton.current?.removeEventListener('mousemove', handleMagnetic);
        };
    }, { scope: container });

    return (
        <section ref={container} className="min-h-dvh w-full flex flex-col justify-center pt-20 lg:pt-24 pb-12 px-6 md:px-12 relative transition-colors duration-500 overflow-hidden" style={{ perspective: "1200px" }}>
            
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center z-10" style={{ transformStyle: "preserve-3d" }}>
                
                <div className="lg:col-span-7 flex flex-col select-none" style={{ transformStyle: "preserve-3d" }}>
                    
                    <h1 className="flex flex-col">
                        {titleLines.map((line, index) => (
                            <div key={index} className="line-wrapper overflow-hidden pb-1">
                                <span
                                    data-text={line.text}
                                    className={`${titleClass} ${line.highlight ? 'text-tarantino italic' : 'text-noir'}`}
                                >
                                    {line.text}
                                </span>
                            </div>
                        ))}
                    </h1>

                    <div className="mt-6 max-w-lg z-10">
                        <p className="text-sm md:text-base font-medium leading-relaxed mb-8 text-noir">
                            We develop custom software solutions and applications to improve operational efficiency and support business objectives.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                ref={magneticButton}
                                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-noir text-parchment px-8 py-4 uppercase font-bold text-xs md:text-sm tracking-widest hover:bg-tarantino hover:text-noir transition-colors text-center shadow-[4px_4px_0px_0px_rgba(255,79,0,0)] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
                            >
                                Start Your Project
                            </button>
                            <button
                                onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                                className="border-2 border-noir text-noir px-8 py-4 uppercase font-bold text-xs md:text-sm tracking-widest hover:bg-noir/5 transition-all text-center"
                            >
                                View Our Work
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 video-container hidden lg:flex justify-center items-center relative w-full aspect-square mt-8 lg:mt-0 lg:translate-x-16 xl:translate-x-20">
                    <div className="relative w-full h-full flex justify-center items-center scale-[1.1] lg:scale-[1.35]">
                        <video 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            aria-label="Nore Agency - 3D Cloud Network Animation representing software systems"
                            className="relative z-10 object-contain w-full h-full"
                        >
                            <source src="/clay-core-loop-nobg.mov" type="video/quicktime; codecs=hvc1" />
                            <source src="/clay-core-loop-nobg.webm" type="video/webm" />
                        </video>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;