'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Business {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
}

interface Props {
    businesses: Business[];
}

export default function EcosystemTree({ businesses }: Props) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Root Node
    const root = {
        id: 'root',
        name: 'Gummadi Groups',
        description: 'The Foundation'
    };

    return (
        <div className="relative w-full py-0 min-h-[700px] flex flex-col items-center justify-start overflow-visible">

            {/* --- Root Node --- */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative z-20"
            >
                <div className="w-32 h-32 rounded-full bg-slate-900 border-8 border-white shadow-2xl flex items-center justify-center relative cursor-default z-20">
                    <span className="text-5xl font-bold text-white">G</span>
                    {/* Pulse Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-amber-500/50 animate-[ping_3s_linear_infinite] opacity-20"></div>
                </div>
                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 text-center w-48 bg-white/50 backdrop-blur-sm p-2 rounded-xl border border-white/40 shadow-sm z-30">
                    <h3 className="font-bold text-slate-900 text-lg leading-none">Gummadi Groups</h3>
                    {/* <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Conglomerate Root</p> */}
                </div>
            </motion.div>

            {/* --- Connector Layer --- */}
            <div className="relative w-full max-w-7xl h-48 -mt-8 mb-0 z-0 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="curve-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
                        </linearGradient>
                    </defs>

                    {/* 
               Geometry Match:
               Left Curve Ends at: x=10, y=95
               Right Curve Ends at: x=90, y=95
            */}

                    {/* Left Curve to 10% */}
                    {businesses[0] && (
                        <path
                            d="M 50 0 C 50 50, 20 20, 10 95"
                            fill="none"
                            stroke="url(#curve-gradient)"
                            strokeWidth="0.8"
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                        />
                    )}

                    {/* Right Curve to 90% */}
                    {businesses[1] && (
                        <path
                            d="M 50 0 C 50 50, 80 20, 90 95"
                            fill="none"
                            stroke="url(#curve-gradient)"
                            strokeWidth="0.8"
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                        />
                    )}
                </svg>
            </div>

            {/* --- Children Nodes Container (Relative for absolute positioning) --- */}
            <div className="w-full max-w-7xl relative -mt-4 z-10 h-64"> {/* Fixed height for area */}

                {/* Left Child - Positioned exactly at 10% */}
                {businesses[0] && (
                    <div className="absolute top-0 left-[10%] -translate-x-1/2 flex justify-center w-80">
                        <Link
                            href={`/businesses/${businesses[0].slug}`}
                            className="group relative flex flex-col items-center w-full"
                            onMouseEnter={() => setHoveredNode(businesses[0].id)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            {/* Connection Point Top - Aligns with SVG (10%) */}
                            <div className="w-4 h-4 rounded-full bg-amber-600 shadow-lg ring-4 ring-white relative z-10 mb-6 group-hover:scale-125 transition-transform"></div>

                            <motion.div
                                className="w-24 h-24 rounded-full bg-white border-4 border-slate-100 group-hover:border-amber-500 shadow-xl flex items-center justify-center relative z-20 transition-all duration-300 group-hover:scale-110 mb-6 bg-slate-50"
                                whileHover={{ rotate: 5 }}
                            >
                                <span className="text-2xl font-bold text-slate-800">{businesses[0].name.substring(0, 2)}</span>
                            </motion.div>

                            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 w-full text-center transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2">
                                <h4 className="font-bold text-xl text-slate-900 mb-3">{businesses[0].name}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2">{businesses[0].shortDescription}</p>
                                <span className="inline-flex items-center text-xs font-bold text-amber-600 uppercase tracking-widest gap-2 group-hover:gap-3 transition-all">
                                    Explore Entity <span className="text-lg leading-none">&rarr;</span>
                                </span>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Right Child - Positioned exactly at 90% */}
                {businesses[1] && (
                    <div className="absolute top-0 left-[90%] -translate-x-1/2 flex justify-center w-80">
                        <Link
                            href={`/businesses/${businesses[1].slug}`}
                            className="group relative flex flex-col items-center w-full"
                            onMouseEnter={() => setHoveredNode(businesses[1].id)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            {/* Connection Point Top - Aligns with SVG (90%) */}
                            <div className="w-4 h-4 rounded-full bg-amber-600 shadow-lg ring-4 ring-white relative z-10 mb-6 group-hover:scale-125 transition-transform"></div>

                            <motion.div
                                className="w-24 h-24 rounded-full bg-white border-4 border-slate-100 group-hover:border-amber-500 shadow-xl flex items-center justify-center relative z-20 transition-all duration-300 group-hover:scale-110 mb-6 bg-slate-50"
                                whileHover={{ rotate: 5 }}
                            >
                                <span className="text-2xl font-bold text-slate-800">{businesses[1].name.substring(0, 2)}</span>
                            </motion.div>

                            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 w-full text-center transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2">
                                <h4 className="font-bold text-xl text-slate-900 mb-3">{businesses[1].name}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2">{businesses[1].shortDescription}</p>
                                <span className="inline-flex items-center text-xs font-bold text-amber-600 uppercase tracking-widest gap-2 group-hover:gap-3 transition-all">
                                    Explore Entity <span className="text-lg leading-none">&rarr;</span>
                                </span>
                            </div>
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
}
