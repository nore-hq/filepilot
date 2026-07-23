"use client";

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const CustomCursor = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isActive, setIsActive] = useState(false); 
    const [isOverOrange, setIsOverOrange] = useState(false);

    const isTouchDevice = () => {
        if (typeof window === "undefined") return false;
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    };

    useGSAP(() => {
        if (!cursorRef.current || !dotRef.current || isTouchDevice()) return;

        // Hide the default system cursor globally using the CSS class
        document.body.classList.add('hide-system-cursor');

        gsap.set(cursorRef.current, { xPercent: -50, yPercent: -50 });
        gsap.set(dotRef.current, { xPercent: -50, yPercent: -50 });
        setIsActive(true); 

        const xToTorch = gsap.quickSetter(cursorRef.current, "x", "px");
        const yToTorch = gsap.quickSetter(cursorRef.current, "y", "px");
        const xToDot = gsap.quickSetter(dotRef.current, "x", "px");
        const yToDot = gsap.quickSetter(dotRef.current, "y", "px");

        const handleMouseMove = (e: MouseEvent) => {
            xToTorch(e.clientX);
            yToTorch(e.clientY);
            xToDot(e.clientX);
            yToDot(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.body.classList.remove('hide-system-cursor');
        };
    }, { scope: cursorRef });


    useGSAP(() => {
        if (!cursorRef.current || !dotRef.current || !isActive) return;

        gsap.to(cursorRef.current, {
            scale: isHovering ? 1.2 : 1,
            opacity: isHovering ? 0.8 : 0.45,
            duration: 0.5,
            ease: "power3.out",
        });

        gsap.to(dotRef.current, {
            scale: isHovering ? 0 : 1,
            opacity: isHovering ? 0 : 1,
            duration: 0.3,
            ease: "power2.out",
        });
    }, [isHovering, isActive]);


    useEffect(() => {
        if (isTouchDevice()) return;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            const isClickable =
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('a') ||
                target.closest('button');

            setIsHovering(!!isClickable);

            const orangeSection = target.closest('footer, #footer, .bg-tarantino');
            setIsOverOrange(!!orangeSection);
        };

        const handleMouseOut = (e: MouseEvent) => {
             const target = e.target as HTMLElement;
             const isClickable = target.closest('a') || target.closest('button');
             if (isClickable) {
                 setIsHovering(false);
             }
        };

        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);

        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
        };
    }, []);

    if (isTouchDevice()) return null;

    const torchRGB = isOverOrange ? '26, 26, 26' : '255, 79, 0';

    return (
        <>
            {/* The Massive Grainy Torch */}
            <div
                ref={cursorRef}
                className={`fixed top-0 left-0 w-[500px] h-[500px] pointer-events-none z-[9998] will-change-transform transition-opacity duration-700 ${isActive ? 'opacity-45' : 'opacity-0'}`}
                style={{
                    backgroundImage: `
                        radial-gradient(circle at center, rgba(${torchRGB}, 0.5) 0%, rgba(${torchRGB}, 0) 50%),
                        url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.25'/%3E%3C/svg%3E")
                    `,
                    WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 50%)',
                    maskImage: 'radial-gradient(circle at center, black 10%, transparent 50%)',
                    transition: 'background-image 0.4s ease-in-out'
                }}
            />

            {/* The Tiny Precise Center Dot */}
            <div
                ref={dotRef}
                className={`fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999] will-change-transform transition-colors duration-300 ${isActive ? 'opacity-100' : 'opacity-0'} ${isOverOrange ? 'bg-noir' : 'bg-tarantino'}`}
            />
        </>
    );
};

export default CustomCursor;