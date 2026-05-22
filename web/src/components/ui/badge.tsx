import React from 'react';

type BadgeProps = {
    children: React.ReactNode;
    status?: "CACHE HIT" | "CACHE MISS" | "ROUTED" | "THROTTLED - 429" | "FAILED - 500" | "CACHE BYPASS" | string;
};

export function Badge({ children, status }: BadgeProps) {
    let bgColor = "bg-slate-700";
    
    if (status === "CACHE HIT") bgColor = "bg-[var(--color-emerald-500)]";
    else if (status === "CACHE MISS") bgColor = "bg-[var(--color-blue-500)]";
    else if (status === "CACHE BYPASS") bgColor = "bg-[var(--color-slate-500)]";
    else if (status === "ROUTED") bgColor = "bg-[var(--color-purple-500)]";
    else if (status === "THROTTLED - 429") bgColor = "bg-[var(--color-amber-500)]";
    else if (status === "FAILED - 500") bgColor = "bg-[var(--color-rose-500)]";

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${bgColor}`}>
            {children}
        </span>
    );
}
