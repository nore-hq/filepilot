"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link'; // Better for Next.js routing

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: 'Services', href: '/#services' },
        { name: 'Portfolio', href: '/#projects' },
        { name: 'Marketplace', href: '/marketplace' },
        { name: 'Process', href: '/#process' },
    ];

    return (
        <>
            {/* Main Nav Bar */}
            <nav className="fixed w-full z-[100] mix-blend-difference text-parchment px-6 md:px-12 py-10 flex justify-between items-center pointer-events-none">
                <Link href="/" className="text-[32px] font-black tracking-tighter uppercase italic pointer-events-auto cursor-pointer">
                    Nore.
                </Link>

                {/* Desktop Links */}
                <div className="hidden lg:flex gap-14 text-[13px] uppercase tracking-[0.3em] font-bold pointer-events-auto items-center">
                    {navLinks.map((link) => (
                        <a key={link.name} href={link.href} className="hover:opacity-50 transition-opacity">
                            {link.name}
                        </a>
                    ))}
                    <a href="/#contact">
                        <button className="border-b-2 border-parchment pb-1 hover:opacity-50 transition-all uppercase">
                            Get in Touch
                        </button>
                    </a>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="lg:hidden pointer-events-auto p-2 text-parchment"
                >
                    <Menu size={32} strokeWidth={2.5} />
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[200] bg-black text-parchment flex flex-col justify-center p-10 lg:hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-10 right-6 md:right-12"
                        >
                            <X size={40} />
                        </button>

                        <div className="flex flex-col gap-12">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="text-6xl font-black uppercase tracking-tighter italic hover:text-tarantino transition-colors"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <a
                                href="/#contact"
                                onClick={() => setIsOpen(false)}
                                className="text-3xl font-bold uppercase tracking-[0.2em] border-b-4 border-parchment w-max mt-4"
                            >
                                Get in Touch
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;