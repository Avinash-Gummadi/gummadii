import { getBusinessBySlug, getBusinesses } from '@/lib/json-loader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const business = await getBusinessBySlug(slug);
    if (!business) return { title: 'Not Found' };

    return {
        title: business.seo.title,
        description: business.seo.description,
        keywords: business.seo.keywords,
    };
}

export async function generateStaticParams() {
    const businesses = await getBusinesses();
    return businesses.map((business) => ({
        slug: business.slug,
    }));
}

export default async function BusinessPage({ params }: Props) {
    const { slug } = await params;
    const business = await getBusinessBySlug(slug);

    if (!business) {
        notFound();
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Header */}
            <div className="relative bg-slate-900 text-white py-32 md:py-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
                <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/Noise.png')]"></div>

                <div className="container relative z-10 mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-5xl font-bold text-white border border-white/20 shadow-2xl">
                            {business.logo ? (
                                <span>{business.name.substring(0, 2).toUpperCase()}</span>
                            ) : (
                                <span>{business.name.substring(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="text-center md:text-left">
                            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-4 border border-amber-500/20">
                                Gummadi Group Company
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">{business.name}</h1>
                            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl font-light">{business.shortDescription}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-20 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-20">
                        <section className="bg-white p-10 md:p-14 rounded-3xl shadow-xl border border-slate-100">
                            <h2 className="text-3xl font-bold text-slate-900 mb-8">About the Business</h2>
                            <div className="prose prose-lg prose-slate text-slate-600 max-w-none leading-relaxed">
                                <p>{business.description}</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-slate-900 mb-10">Services & Solutions</h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                {business.services.map((service, index) => (
                                    <div key={index} className="group bg-slate-50 hover:bg-white p-8 rounded-3xl border border-slate-200 hover:border-amber-200 hover:shadow-xl transition-all duration-300">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm mb-6 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        </div>
                                        <h3 className="font-bold text-xl text-slate-900 mb-3">{service.title}</h3>
                                        <p className="text-slate-600 leading-relaxed">{service.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        {business.domain && (
                            <a
                                href={`https://${business.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between w-full bg-slate-900 text-white font-bold py-5 px-8 rounded-2xl hover:bg-slate-800 transition-all hover:scale-[1.02] shadow-xl shadow-slate-900/20"
                            >
                                <span>Visit Official Website</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            </a>
                        )}

                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg">
                            <h3 className="font-bold text-slate-900 mb-6 text-xl">Contact Details</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-amber-50 p-2 rounded-lg text-amber-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Email</label>
                                        <a href={`mailto:${business.contact.email}`} className="text-slate-900 font-medium hover:text-amber-600 transition-colors break-all">
                                            {business.contact.email}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-amber-50 p-2 rounded-lg text-amber-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Phone</label>
                                        <p className="text-slate-900 font-medium">{business.contact.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-orange-500/20">
                            <h3 className="font-bold text-xl mb-3">Partner with Us</h3>
                            <p className="text-white/90 text-sm mb-6 leading-relaxed">Interested in our services? Get in touch with our distinct team for {business.name}.</p>
                            <Link href="/contact" className="block w-full text-center bg-white text-orange-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">
                                Start Conversation
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
