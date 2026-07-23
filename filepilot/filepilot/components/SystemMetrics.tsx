"use client";

import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

/**
 * SystemMetrics — A dark "control panel" section displaying
 * engineering metrics with a live-counting animation.
 * Pure CSS borders and typography — no icon libraries.
 */

interface Metric {
    value: string;
    suffix: string;
    label: string;
    sublabel: string;
    numericTarget: number;
}

const metrics: Metric[] = [
    {
        value: "50",
        suffix: "ms",
        label: "Global Latency",
        sublabel: "Edge-optimized delivery",
        numericTarget: 50,
    },
    {
        value: "99.99",
        suffix: "%",
        label: "Uptime Architecture",
        sublabel: "Redundant cloud infrastructure",
        numericTarget: 99.99,
    },
    {
        value: "256",
        suffix: "-bit",
        label: "Encryption Standard",
        sublabel: "End-to-end data security",
        numericTarget: 256,
    },
    {
        value: "∞",
        suffix: "",
        label: "Scalability",
        sublabel: "Serverless auto-scaling",
        numericTarget: -1, // special: no counting
    },
];

const CountingNumber = ({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) => {
    const [display, setDisplay] = useState("0");

    useEffect(() => {
        if (!inView) return;
        if (target < 0) {
            setDisplay("∞");
            return;
        }

        const isDecimal = target % 1 !== 0;
        const duration = 2000; // 2 seconds
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            setDisplay(isDecimal ? current.toFixed(2) : Math.floor(current).toString());

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [inView, target]);

    return (
        <span className="tabular-nums">
            {target < 0 ? "∞" : display}
            <span className="text-tarantino">{suffix}</span>
        </span>
    );
};

const SystemMetrics = () => {
    const container = useRef<HTMLElement>(null);
    const [inView, setInView] = useState(false);

    useGSAP(() => {
        // Stagger reveal the metric cards
        gsap.fromTo(
            ".metric-card",
            { y: 60, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: container.current,
                    start: "top 80%",
                    toggleActions: "play none none none",
                    onEnter: () => setInView(true),
                },
            }
        );

        // Animate the status indicator pulse
        gsap.to(".status-pulse", {
            scale: 1.5,
            opacity: 0,
            repeat: -1,
            duration: 1.5,
            ease: "power2.out",
        });
    }, { scope: container });

    return (
        <section
            ref={container}
            className="bg-noir text-parchment py-28 md:py-36 px-6 md:px-10 relative overflow-hidden"
        >
            {/* Subtle grid background */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(241,239,231,0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(241,239,231,0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 md:mb-20">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                                <div className="status-pulse absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full" />
                            </div>
                            <span className="text-xs uppercase tracking-[0.4em] font-black text-green-400">
                                Systems Operational
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
                            Built for{" "}
                            <span className="text-tarantino">performance.</span>
                        </h2>
                    </div>

                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest max-w-xs">
                        Every system we deliver is engineered to enterprise-grade standards.
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-white/10">
                    {metrics.map((metric, i) => (
                        <div
                            key={i}
                            className="metric-card p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-white/10 last:border-r-0 last:border-b-0 group hover:bg-white/[0.03] transition-colors duration-500 relative"
                        >
                            {/* Metric Number */}
                            <div className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-none">
                                {metric.numericTarget < 0 ? (
                                    <span className="text-tarantino/30" style={{ WebkitTextStroke: '1.5px rgba(255,79,0,0.6)' }}>
                                        ∞
                                    </span>
                                ) : metric.suffix === "%" ? (
                                    <>
                                        <span className="text-parchment">&lt;</span>
                                        <CountingNumber target={metric.numericTarget} suffix={metric.suffix} inView={inView} />
                                    </>
                                ) : metric.suffix === "-bit" ? (
                                    <CountingNumber target={metric.numericTarget} suffix={metric.suffix} inView={inView} />
                                ) : (
                                    <>
                                        <span className="text-parchment">&lt;</span>
                                        <CountingNumber target={metric.numericTarget} suffix={metric.suffix} inView={inView} />
                                    </>
                                )}
                            </div>

                            {/* Label */}
                            <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-parchment">
                                {metric.label}
                            </h3>
                            <p className="text-xs font-bold uppercase tracking-wider text-white/30">
                                {metric.sublabel}
                            </p>

                            {/* Corner accent */}
                            <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-tarantino/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-tarantino/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    ))}
                </div>

                {/* Bottom Tagline */}
                <div className="mt-12 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                    <div className="h-[1px] w-12 bg-tarantino/40" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/20">
                        Zero-Trust Security · Edge Computing · CI/CD Pipelines · Automated Testing
                    </p>
                </div>
            </div>
        </section>
    );
};

export default SystemMetrics;
