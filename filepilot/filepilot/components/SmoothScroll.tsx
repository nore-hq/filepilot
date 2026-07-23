"use client";

import { ReactLenis, useLenis } from '@studio-freight/react-lenis';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

// Use 'any' or the specific library's expected type if standard ReactNode fails
interface SmoothScrollProps {
    children: any;
}

function ScrollTriggerSync() {
    useLenis((lenis: any) => {
        // This syncs Lenis scroll position with ScrollTrigger on every frame
        ScrollTrigger.update();
    });

    useEffect(() => {
        // After Lenis mounts and takes over scrolling, tell ScrollTrigger
        // to recalculate all pin positions & trigger points
        const timer = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return null;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
    return (
        <ReactLenis
            root
            options={{
                lerp: 0.1,
                duration: 1.5,
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 2,
                infinite: false,
                syncTouch: true,
            }}
        >
            <ScrollTriggerSync />
            <>{children}</>
        </ReactLenis>
    );
}