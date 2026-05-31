import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-20 pb-10">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="font-bold text-2xl tracking-tight text-white mb-6 block flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">G</div>
                            Gummadi Groups
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-500">
                            A diversified conglomerate weaving excellence into every venture. Building a sustainable future through innovation and integrity.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Company</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/about" className="hover:text-amber-500 transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-amber-500 transition-colors">Careers</Link></li>
                            <li><Link href="/news" className="hover:text-amber-500 transition-colors">News & Media</Link></li>
                            <li><Link href="/contact" className="hover:text-amber-500 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Businesses</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/businesses/uma-textiles" className="hover:text-amber-500 transition-colors">Uma Textiles & Fancy</Link></li>
                            <li><Link href="/businesses/techtools" className="hover:text-amber-500 transition-colors">Techtools</Link></li>
                            <li><Link href="/businesses/bills" className="hover:text-amber-500 transition-colors">Bills</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Contact</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-slate-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span>Hyderabad, Telangana<br />India 500001</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                <a href="mailto:info@gummadii.com" className="hover:text-white transition-colors">info@gummadii.com</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600">
                    <p>&copy; {currentYear} Gummadi Groups. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-amber-500 transition-colors">Terms of Use</Link>
                        <Link href="/admin" className="hover:text-white transition-colors opacity-50 hover:opacity-100">Employee Login</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
