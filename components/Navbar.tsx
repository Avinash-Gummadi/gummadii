'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Business {
    id: string;
    name: string;
    slug: string;
}

export default function Navbar({ businesses }: { businesses: Business[] }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-slate-950/95 shadow-lg backdrop-blur-md py-2' : 'bg-transparent py-4'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="group flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
                        <span className="font-outfit font-bold text-white text-xl">G</span>
                    </div>
                    <span className="font-outfit font-bold text-xl tracking-tight text-white group-hover:text-amber-400 transition-colors">Gummadi Groups</span>
                </Link>

                <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-300">
                    <Link href="/#businesses" className="hover:text-white transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-amber-500 after:transition-all hover:after:w-full">
                        Our Businesses
                    </Link>

                    <div className="relative group h-full flex items-center">
                        <button className="hover:text-white transition-colors flex items-center gap-1 py-2">
                            Network
                            <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div className="absolute right-0 top-full pt-4 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <div className="glass bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-2 border border-white/20 overflow-hidden">
                                {businesses.map(b => (
                                    <Link key={b.id} href={`/businesses/${b.slug}`} className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 rounded-xl transition-colors flex items-center justify-between group/item">
                                        {b.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="md:hidden">
                    <button className="text-white p-2">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
