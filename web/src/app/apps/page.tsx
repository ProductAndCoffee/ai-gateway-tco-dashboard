"use client";
import React, { useEffect, useState } from 'react';
import { fetchApps, patchAppLimits } from '@/lib/api';
import { AppModel } from '@/lib/types';

export default function AppsPage() {
    const [apps, setApps] = useState<AppModel[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchApps();
                setApps(data);
            } catch {
                console.error("Failed to fetch apps");
            }
        };
        load();
        const interval = setInterval(load, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleEditLimit = async (appId: string, currentRpm: number, currentBudget: number) => {
        const newRpm = prompt("Enter new RPM limit:", currentRpm.toString());
        if (!newRpm) return;
        const newBudget = prompt("Enter new Budget limit:", currentBudget.toString());
        if (!newBudget) return;
        
        await patchAppLimits(appId, parseInt(newRpm), parseFloat(newBudget));
    };

    const formatSpend = (value: number) => {
        if (value === 0) return "$0.00";
        if (value < 0.01) return `$${value.toFixed(5)}`;
        return `$${value.toFixed(2)}`;
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <h1 className="text-2xl font-bold mb-6">Apps Management</h1>
            <p className="text-slate-400 mb-8">Manage active API integrations and view budget utilization.</p>

            <div className="bg-[var(--color-surface)] border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-800/50 text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium">App Context</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Requests / Current RPM</th>
                            <th className="px-4 py-3 font-medium">Budget Utilization</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {apps.map((app) => {
                            const budgetPct = Math.min(100, (app.spend / app.budget_limit) * 100);
                            let statusColor = "bg-[var(--color-emerald-500)]";
                            if (app.status === "Limited") statusColor = "bg-[var(--color-amber-500)]";
                            if (app.status === "Budget Exceeded") statusColor = "bg-[var(--color-rose-500)]";
                            
                            return (
                                <tr key={app.app_id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-white">{app.display_name}</div>
                                        <div className="text-xs text-slate-500 font-mono mt-1">{app.app_id}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white ${statusColor}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="font-mono text-white">{app.requests} total</div>
                                        <div className="font-mono text-xs text-slate-400 mt-1">
                                            {app.current_rpm} / {app.rpm_limit} rpm
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-64">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>{formatSpend(app.spend)}</span>
                                            <span className="text-slate-500">${app.budget_limit.toFixed(2)}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${budgetPct > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${budgetPct}%`, minWidth: app.spend > 0 ? '2px' : '0' }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditLimit(app.app_id, app.rpm_limit, app.budget_limit)} className="text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors">Edit Limit</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
