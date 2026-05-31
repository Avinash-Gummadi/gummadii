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

// Position config for up to 5 nodes – easy to extend later
const POSITIONS = [
    { left: '10%', curveEnd: '10' },   // leftmost
    { left: '50%', curveEnd: '50' },   // center
    { left: '90%', curveEnd: '90' },   // rightmost
];

function BusinessCard({
    biz,
    position,
    index,
    onHover,
}: {
    biz: Business;
    position: (typeof POSITIONS)[number];
    index: number;
    onHover: (id: string | null) => void;
}) {
    return (
        <div
            className="absolute top-0 -translate-x-1/2 flex justify-center w-80"
            style={{ left: position.left }}
        >
            <Link
                href={`/businesses/${biz.slug}`}
                className="group relative flex flex-col items-center w-full"
                onMouseEnter={() => onHover(biz.id)}
                onMouseLeave={() => onHover(null)}
            >
                {/* Connection dot */}
                <div className="w-4 h-4 rounded-full bg-amber-600 shadow-lg ring-4 ring-white relative z-10 mb-6 group-hover:scale-125 transition-transform"></div>

                <motion.div
                    className="w-24 h-24 rounded-full bg-white border-4 border-slate-100 group-hover:border-amber-500 shadow-xl flex items-center justify-center relative z-20 transition-all duration-300 group-hover:scale-110 mb-6 bg-slate-50"
                    whileHover={{ rotate: 5 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                    <span className="text-2xl font-bold text-slate-800">{biz.name.substring(0, 2)}</span>
                </motion.div>

                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 w-full text-center transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2">
                    <h4 className="font-bold text-xl text-slate-900 mb-3">{biz.name}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2">{biz.shortDescription}</p>
                    <span className="inline-flex items-center text-xs font-bold text-amber-600 uppercase tracking-widest gap-2 group-hover:gap-3 transition-all">
                        Explore Entity <span className="text-lg leading-none">&rarr;</span>
                    </span>
                </div>
            </Link>
        </div>
    );
}

export default function EcosystemTree({ businesses }: Props) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Map businesses to positions
    const positions =
        businesses.length === 1
            ? [POSITIONS[1]] // center only
            : businesses.length === 2
                ? [POSITIONS[0], POSITIONS[2]] // left + right
                : POSITIONS; // left + center + right

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

                    {businesses.map((_, i) => {
                        if (i >= positions.length) return null;
                        const endX = parseInt(positions[i].curveEnd);

                        // Center node: slight S-curve so it's visible
                        if (endX === 50) {
                            return (
                                <path
                                    key={i}
                                    d="M 50 0 C 48 30, 52 60, 50 95"
                                    fill="none"
                                    stroke="url(#curve-gradient)"
                                    strokeWidth="0.8"
                                    vectorEffect="non-scaling-stroke"
                                    strokeLinecap="round"
                                />
                            );
                        }

                        // Left/right nodes: bezier curves
                        const cp2x = endX + (endX < 50 ? -10 : 10);
                        return (
                            <path
                                key={i}
                                d={`M 50 0 C 50 50, ${cp2x} 20, ${endX} 95`}
                                fill="none"
                                stroke="url(#curve-gradient)"
                                strokeWidth="0.8"
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>
            </div>

            {/* --- Children Nodes --- */}
            <div className="w-full max-w-7xl relative -mt-4 z-10 h-64">
                {businesses.map((biz, i) => {
                    if (i >= positions.length) return null;
                    return (
                        <BusinessCard
                            key={biz.id}
                            biz={biz}
                            position={positions[i]}
                            index={i}
                            onHover={setHoveredNode}
                        />
                    );
                })}
            </div>
        </div>
    );
}
