'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Focus input + inject GITA greeting when panel opens
    useEffect(() => {
        if (open) {
            inputRef.current?.focus();
            if (messages.length === 0) {
                setLoading(true);
                const timer = setTimeout(() => {
                    setMessages([{ role: 'assistant', content: "Hi! \u{1F44B} I'm GITA. How can I help you today?" }]);
                    setLoading(false);
                }, 400);
                return () => clearTimeout(timer);
            }
        }
    }, [open]);

    async function handleSend(e: FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: Message = { role: 'user', content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            // Handle potential non-JSON responses (like HTML 404/500 pages)
            const contentType = res.headers.get('content-type');
            let data: any = {};
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                await res.text(); // Consume body
                throw new Error('Invalid server response');
            }

            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.reply },
            ]);
        } catch (err: unknown) {
            console.error('Chatbot API Error:', err);
            // Hide technical details from user, just show a generic friendly message
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '⚠️ Something went wrong. Please try again later.' },
            ]);
            // Restore the input so the user can easily retry
            setInput(text);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {/* ── Floating Action Button ── */}
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Close chat' : 'Open chat'}
                className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-110 hover:shadow-orange-500/50 active:scale-95 cursor-pointer"
            >
                {open ? (
                    /* X icon */
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    /* Chat icon */
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </button>

            {/* ── Chat Panel ── */}
            <div
                className={`fixed bottom-24 right-6 z-[9998] w-[calc(100vw-3rem)] sm:w-[400px] transition-all duration-300 origin-bottom-right ${open
                    ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto'
                    : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
                    }`}
            >
                <div className="flex flex-col h-[min(520px,70vh)] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-white/90 backdrop-blur-xl dark:bg-slate-900/90">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-sm font-bold">
                                G
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold leading-tight">GITA</h3>
                                {/* <p className="text-[10px] text-slate-400 leading-tight">Gummadi Intelligent Task Assistant</p> */}
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-lg p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
                            aria-label="Close chat"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">


                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-md'
                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-md'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSend}
                        className="flex items-center gap-2 border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-white/80 dark:bg-slate-900/80 shrink-0"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message…"
                            disabled={loading}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/50 transition-shadow placeholder:text-slate-400 text-slate-800 dark:text-slate-200 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                            aria-label="Send message"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
