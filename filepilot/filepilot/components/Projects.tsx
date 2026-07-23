"use client";


import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Github, BadgeCheck } from 'lucide-react'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { projectList } from './projectsData';

const Projects = () => {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const [displayProjects, setDisplayProjects] = useState(projectList);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Shuffle all projects on load
        const shuffled = [...projectList].sort(() => 0.5 - Math.random());
        setDisplayProjects(shuffled);
    }, []);

    // Auto-scroll the carousel every 4 seconds
    useEffect(() => {
        if (!mounted) return;
        
        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                // If we're at the end (or very close), snap back to beginning
                if (scrollLeft + clientWidth >= scrollWidth - 50) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    scrollRef.current.scrollBy({ left: 450, behavior: 'smooth' });
                }
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [mounted]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 20);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
        }
    };

    useEffect(() => {
        handleScroll();
    }, [displayProjects]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -450 : 450;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section
            id="projects"
            className="py-32 relative min-h-screen border-b border-noir/10"
        >
            <div className="px-10 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
                <div>
                    <h2 className="text-xs uppercase tracking-[0.4em] font-black mb-4 text-noir">The Marketplace</h2>
                    <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-noir">Our Products</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/marketplace"
                        className="px-6 py-3 text-sm uppercase font-bold tracking-widest border-2 border-noir bg-noir text-parchment hover:bg-transparent hover:text-noir transition-colors duration-300 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    >
                        Check Out Marketplace
                    </Link>
                </div>
            </div>

            {/* MARKETPLACE CAROUSEL AREA */}
            <div className="relative w-full group z-10">
                
                <div 
                    onClick={() => scroll('left')}
                    className={`absolute left-0 top-0 bottom-12 w-24 md:w-48 bg-gradient-to-r from-parchment via-parchment/90 to-transparent z-20 cursor-pointer flex items-center justify-start pl-4 md:pl-8 transition-all duration-300 group ${
                        !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                >
                    <ChevronLeft size={48} strokeWidth={1.5} className="text-noir transition-transform duration-300 group-hover:-translate-x-2" />
                </div>

                <div 
                    onClick={() => scroll('right')}
                    className={`absolute right-0 top-0 bottom-12 w-24 md:w-48 bg-gradient-to-l from-parchment via-parchment/90 to-transparent z-20 cursor-pointer flex items-center justify-end pr-4 md:pr-8 transition-all duration-300 group ${
                        !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                >
                    <ChevronRight size={48} strokeWidth={1.5} className="text-noir transition-transform duration-300 group-hover:translate-x-2 animate-pulse md:animate-none" />
                </div>

                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth px-10 pb-12 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full"
                >
                    {displayProjects.map((p, idx) => {
                        return (
                            <div
                                key={idx}
                                onClick={() => router.push('/marketplace')}
                                className={`snap-center shrink-0 w-[85vw] md:w-[450px] lg:w-[500px] flex flex-col border-4 border-noir cursor-pointer transition-transform duration-300 hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] bg-parchment ${p.color}`}
                            >
                                <div className="relative h-64 md:h-80 w-full border-b-4 border-noir overflow-hidden bg-noir">
                                    <Image
                                        unoptimized
                                        src={p.imgSrc}
                                        alt={p.name}
                                        fill
                                        sizes="(max-width: 768px) 85vw, 500px"
                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
                                    />
                                </div>

                                <div className="p-8 flex flex-col flex-grow justify-between gap-6">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2 block">
                                            {p.tag}
                                        </span>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">
                                            {p.name}
                                        </h3>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {p.tools.map((tool, idx) => (
                                            <span 
                                                key={idx} 
                                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 border border-current opacity-80"
                                            >
                                                {tool}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-1 mt-4 pt-4 border-t-2 border-noir/10">
                                        <div className="flex items-center gap-2">
                                            <BadgeCheck size={18} className="text-green-600 shrink-0" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-noir/70">Verified</span>
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-noir/70">
                                            Developed by <span className="text-noir font-black">{p.creator || 'ALOK K L'}</span> at NOREHQ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </section>
    );
};

export default Projects;