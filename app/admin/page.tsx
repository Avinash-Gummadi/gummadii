import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
    // Double check cookie here if needed, but middleware handles it.

    const files = [
        { name: 'Groups', file: 'groups.json', desc: 'Manage business groups information' },
        { name: 'Businesses', file: 'businesses.json', desc: 'Add or edit child companies' },
        { name: 'Pages', file: 'pages.json', desc: 'Edit static page content' },
        { name: 'SEO', file: 'seo.json', desc: 'Global SEO settings' },
        { name: 'News', file: 'news.json', desc: 'Manage news items' },
        { name: 'Careers', file: 'careers.json', desc: 'Manage job postings' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Gummadi OS</h1>
                        <p className="text-slate-500">System Dashboard</p>
                    </div>
                    {/* Logout logic would be a form action or client component */}
                    <form action={async () => {
                        'use server';
                        const cookieStore = await cookies();
                        cookieStore.delete('admin_session');
                        redirect('/');
                    }}>
                        <button className="text-red-600 hover:text-red-700 font-medium">Logout</button>
                    </form>
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {files.map((item) => (
                        <Link
                            key={item.file}
                            href={`/admin/edit/${item.file}`}
                            className="block bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all hover:border-amber-500 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-amber-100 transition-colors">
                                    <span className="font-mono text-xs text-slate-500 group-hover:text-amber-700">{item.file}</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.name}</h3>
                            <p className="text-slate-600 text-sm">{item.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
