'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
    filename: string;
    initialContent: string;
}

export default function JsonEditor({ filename, initialContent }: Props) {
    const [content, setContent] = useState(initialContent);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    const handleSave = async () => {
        setStatus('saving');
        setErrorMsg('');

        try {
            // Validate JSON
            const jsonContent = JSON.parse(content);

            const res = await fetch('/api/admin/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content: jsonContent }),
            });

            if (res.ok) {
                setStatus('saved');
                router.refresh();
                setTimeout(() => setStatus('idle'), 2000);
            } else {
                setStatus('error');
                setErrorMsg('Failed to save on server');
            }
        } catch (e: any) {
            setStatus('error');
            setErrorMsg('Invalid JSON: ' + e.message);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="bg-slate-100 border-b border-slate-200 p-2 flex justify-end gap-2">
                {status === 'saved' && <span className="text-green-600 font-bold flex items-center px-4">Saved!</span>}
                {status === 'error' && <span className="text-red-500 text-sm flex items-center px-4">{errorMsg}</span>}

                <button
                    onClick={() => {
                        try {
                            const parsed = JSON.parse(content);
                            setContent(JSON.stringify(parsed, null, 2));
                        } catch (e) { alert('Invalid JSON'); }
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded"
                >
                    Format
                </button>
                <button
                    onClick={handleSave}
                    disabled={status === 'saving'}
                    className="bg-slate-900 text-white font-bold py-2 px-6 rounded hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                    {status === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            <textarea
                value={content}
                onChange={(e) => {
                    setContent(e.target.value);
                    setStatus('idle');
                }}
                className="flex-grow w-full p-6 font-mono text-sm outline-none resize-none bg-slate-50 text-slate-800"
                spellCheck="false"
            />
        </div>
    );
}
