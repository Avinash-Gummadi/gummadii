import fs from 'fs/promises';
import path from 'path';
import JsonEditor from './JsonEditor';

interface Props {
    params: Promise<{ filename: string }>;
}

export default async function EditPage({ params }: Props) {
    const { filename } = await params;
    // Security check same as API
    if (filename.includes('..') || filename.includes('/') || !filename.endsWith('.json')) {
        return <div>Invalid file</div>;
    }

    const filePath = path.join(process.cwd(), 'data', filename);
    let content = '';
    try {
        content = await fs.readFile(filePath, 'utf-8');
    } catch (e) {
        return <div>File not found</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Editing: {filename}</h1>
                        <p className="text-slate-500 text-sm">Make changes to raw JSON</p>
                    </div>
                    <a href="/admin" className="text-slate-600 hover:text-slate-900 font-medium">Back to Dashboard</a>
                </div>
                <div className="flex-grow bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
                    <JsonEditor filename={filename} initialContent={content} />
                </div>
            </div>
        </div>
    );
}
