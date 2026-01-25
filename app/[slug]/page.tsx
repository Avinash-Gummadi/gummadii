import { getPages } from '@/lib/json-loader';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const pages = await getPages();
    const page = pages[slug];

    if (!page) return { title: 'Page Not Found' };

    return {
        title: page.title ? `${page.title} | Gummadi Groups` : 'Gummadi Groups',
        description: page.description,
    };
}

export async function generateStaticParams() {
    const pages = await getPages();
    return Object.keys(pages).filter(key => key !== 'home').map(slug => ({ slug }));
}

export default async function StaticPage({ params }: Props) {
    const { slug } = await params;
    const pages = await getPages();
    const page = pages[slug];

    if (!page) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">{page.title}</h1>
            <div className="prose prose-lg prose-slate max-w-none">
                {/* Simple content support for now - expandable to markdown later if needed */}
                <p>{page.content}</p>
            </div>
        </div>
    );
}
