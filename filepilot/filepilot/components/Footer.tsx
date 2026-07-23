"use client";

import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { X, Github, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const Footer = () => {
    const container = useRef<HTMLElement>(null);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // --- WEB3FORMS HANDLER ---
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        formData.append("access_key", "2ed1d61d-b715-41e9-936a-31def92749ad");

        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            setIsSuccess(true);
            setIsSubmitting(false);
        } else {
            console.log("Error", data);
            alert("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    useGSAP(() => {
        gsap.to(".marquee-inner", {
            xPercent: -50,
            repeat: -1,
            duration: 20,
            ease: "linear"
        });

        if (!showForm) {
            gsap.fromTo(".cta-button",
                { scale: 0.8, opacity: 0 },
                {
                    scale: 1, opacity: 1, duration: 1.2,
                    ease: "back.out(1.7)",
                    scrollTrigger: {
                        trigger: ".cta-button",
                        start: "top 95%",
                        toggleActions: "play none none none",
                    }
                }
            );
        }
    }, { scope: container, dependencies: [showForm] });

    return (
        <footer id="contact" ref={container} className="bg-[#D45D22] text-noir pt-32 pb-10 border-t-4 border-noir overflow-hidden">
            {/* Infinite Marquee */}
            <div className="border-y-4 border-noir py-8 bg-parchment overflow-hidden whitespace-nowrap rotate-[-1deg] scale-105">
                <div className="marquee-inner flex font-black text-6xl md:text-9xl uppercase tracking-tighter italic">
                    {[...Array(8)].map((_, i) => (
                        <span key={i} className={`mx-4 ${i % 2 !== 0 ? 'text-transparent' : ''}`}
                            style={{ WebkitTextStroke: i % 2 !== 0 ? '2px #050505' : 'none' }}>
                            Contact Us •
                        </span>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-6 mt-32 min-h-[500px]">
                {!showForm ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="text-center lg:text-left">
                            <h2 className="text-parchment text-6xl md:text-[7vw] font-black uppercase leading-[0.85] tracking-tighter mb-8">
                                Contact <br /> <span className="text-noir">Us.</span>
                            </h2>
                            <p className="text-noir/80 text-xl font-bold uppercase tracking-widest">
                                CURRENTLY ACCEPTING NEW CLIENT PROJECTS.
                            </p>
                        </div>
                        <div className="flex justify-center lg:justify-end">
    <button onClick={() => setShowForm(true)} className="cta-button group relative block w-64 h-64 md:w-80 md:h-80">
        <div className="w-full h-full bg-noir text-parchment rounded-full border-4 border-parchment shadow-[12px_12px_0px_0px_rgba(244,235,208,1)] group-hover:shadow-none transition-all duration-500 flex items-center justify-center">
            <span className="text-2xl font-black uppercase group-hover:opacity-0 transition-opacity">Get In Touch</span>
            
            {/* CHANGED: bg-tarantino is now bg-yellow-400 */}
            <div className="absolute inset-0 bg-yellow-400 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full"></div>
            
            <span className="absolute inset-0 flex items-center justify-center text-noir opacity-0 group-hover:opacity-100 z-20 text-3xl font-black uppercase italic">CONTACT<br />US</span>
        </div>
    </button>
</div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-12 duration-700">
                        <div className="flex justify-between items-center mb-12 border-b-2 border-noir pb-4">
                            <h3 className="text-3xl font-black uppercase tracking-tighter">Project Inquiry</h3>
                            <button onClick={() => setShowForm(false)} className="hover:rotate-90 transition-transform duration-300">
                                <X size={40} />
                            </button>
                        </div>

                        {isSuccess ? (
                            <div className="py-20 text-center">
                                <h4 className="text-5xl font-black uppercase italic text-parchment mb-4">Inquiry Sent.</h4>
                                <p className="font-bold text-noir uppercase tracking-widest">Check your email. We'll be in touch.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Honeypot Spam Protection (Optional) */}
                                <input type="checkbox" name="botcheck" className="hidden" style={{ display: "none" }} />

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-60">Your Email</label>
                                    <input type="email" name="email" required className="bg-transparent border-b-2 border-noir py-3 text-xl outline-none focus:border-parchment transition-colors" placeholder="ceo@yourbrand.com" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-60">Subject</label>
                                    <input type="text" name="subject" defaultValue="New Project Inquiry - Nore" className="bg-transparent border-b-2 border-noir py-3 text-xl outline-none focus:border-parchment transition-colors" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-60">How can we help?</label>
                                    <textarea name="message" required rows={3} className="bg-transparent border-b-2 border-noir py-3 text-xl outline-none focus:border-parchment transition-colors resize-none" placeholder="Describe the challenge..." />
                                </div>
                                <button type="submit" disabled={isSubmitting} className="md:col-span-2 bg-noir text-parchment py-6 font-black uppercase tracking-[0.3em] hover:bg-parchment hover:text-noir transition-all active:scale-95 disabled:opacity-50">
                                    {isSubmitting ? "TRANSMITTING..." : "SEND INQUIRY"}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Section */}
            <div className="container mx-auto px-6 mt-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-t-2 border-noir/10 pt-16">
                <div>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-6 opacity-40">Connect</h4>
                    <div className="flex gap-6 items-center mb-6">
                        <a href="https://x.com/norehq_" className="hover:text-parchment transition-colors hover:scale-110 transform duration-300" aria-label="X / Twitter">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5">
                                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                            </svg>
                        </a>
                        <a href="https://github.com/nore-hq" className="hover:text-parchment transition-colors hover:scale-110 transform duration-300" aria-label="GitHub">
                            <Github size={32} strokeWidth={2.5} />
                        </a>
                        <a href="https://www.linkedin.com/in/nore-hq-529aa2412/" className="hover:text-parchment transition-colors hover:scale-110 transform duration-300" aria-label="LinkedIn">
                            <Linkedin size={32} strokeWidth={2.5} />
                        </a>
                    </div>
                    <a href="mailto:team@norehq.com" className="flex items-center gap-3 hover:text-parchment transition-colors font-black uppercase tracking-tighter text-sm group">
                        <Mail size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform duration-300" />
                        team@norehq.com
                    </a>
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-6 opacity-40">Products</h4>
                    <div className="flex flex-col gap-3 font-black uppercase text-sm tracking-tighter">
                        <Link href="/marketplace" className="hover:text-parchment transition underline">Nore Marketplace</Link>
                        <a href="https://filepilot.norehq.com" className="hover:text-parchment transition underline">FilePilot Portal</a>
                    </div>
                </div>
                <div className="text-center md:text-left">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-6 opacity-40">Location</h4>
                    <p className="font-black text-sm tracking-tighter italic uppercase">Remote First. Built Everywhere.</p>
                </div>
                <div className="lg:text-right">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-6 opacity-40">Vision</h4>
                    <p className="font-black text-sm tracking-tighter">PROFESSIONAL SOFTWARE<br />DEVELOPMENT.</p>
                </div>
            </div>

            {/* UPDATED LOGO: Scaled up to text-5xl/6xl so it feels like a proper brand mark */}
            <div className="container mx-auto px-6 mt-20 mb-10 flex justify-center md:justify-start">
                <Link href="/" className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic pointer-events-auto cursor-pointer hover:text-parchment transition-colors">
                    Nore<span className="text-yellow-400">.</span>
                </Link>
            </div>
            
            <div className="container mx-auto px-6 text-[10px] uppercase font-black tracking-[0.2em] opacity-40 text-center md:text-left">
                <p>© 2026 NORE STUDIO — ALL RIGHTS RESERVED.</p>
            </div>
        </footer>
    );
};

export default Footer;