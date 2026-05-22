import React from 'react';

export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-[var(--color-surface)] border border-slate-700 rounded-lg p-6 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-slate-400 text-sm font-medium mb-2">{children}</h3>;
}

export function CardValue({ children, trend = "" }: { children: React.ReactNode, trend?: string }) {
    return (
        <div>
            <div className="text-3xl font-bold text-white mb-1">{children}</div>
            {trend && <div className="text-xs text-[var(--color-emerald-500)]">{trend}</div>}
        </div>
    );
}
