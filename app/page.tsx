import Link from 'next/link';
import { getBusinesses, getPages } from '@/lib/json-loader';

import EcosystemTree from '@/components/EcosystemTree';

export default async function Home() {
  const pages = await getPages();
  const businesses = await getBusinesses();
  const { hero, vision } = pages.home;

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Immersive Hero Section */}
      {/* Immersive Hero Section - Compacted */}
      <section className="relative pt-32 pb-12 flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
          <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>

        {/* Grain Overlay */}
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/Noise.png')] pointer-events-none"></div>

        <div className="relative z-10 container mx-auto px-6 text-center max-w-5xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight leading-[1.1] text-white animate-fade-in-up delay-100">
            Building the <span className="text-gradient-light">Future</span>, <br />
            Rooted in <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Values</span>.
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-6 font-light max-w-3xl mx-auto leading-relaxed text-balance animate-fade-in-up delay-200">
            {hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up delay-300">
            <Link
              href={hero.ctaLink}
              className="group relative px-6 py-3 bg-amber-500 rounded-full font-bold text-slate-900 transition-all hover:bg-amber-400 hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                {hero.ctaText}
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>


      {/* Ecosystem Tree Visualization */}
      <section id="businesses" className="bg-slate-50 py-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-2">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Our Ecosystem</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              A hierarchy of excellence. Rooted in Gummadi, branching into the future.
            </p>
          </div>

          <EcosystemTree businesses={businesses} />
        </div>
      </section>

    </div>
  );
}
