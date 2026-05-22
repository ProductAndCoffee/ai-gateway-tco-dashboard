"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
    const pathname = usePathname();

    const links = [
        { name: 'Overview', href: '/' },
        { name: 'Live Traffic', href: '/traffic' },
        { name: 'Apps', href: '/apps' },
        { name: 'Demo Controls', href: '/controls' }
    ];

    return (
        <aside className="w-64 border-r border-slate-800 h-screen sticky top-0 bg-[var(--color-background)] flex flex-col pt-6 px-4">
            <div className="mb-8 px-2">
                <h1 className="text-xl font-bold text-white">AI Gateway</h1>
                <p className="text-xs text-slate-400">Simulator</p>
            </div>
            
            <nav className="flex flex-col gap-2">
                {links.map(link => {
                    const isActive = pathname === link.href;
                    return (
                        <Link 
                            key={link.name} 
                            href={link.href}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive 
                                ? 'bg-slate-800 text-white border border-slate-700' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                        >
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
