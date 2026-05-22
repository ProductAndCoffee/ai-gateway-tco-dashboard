"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { fetchOverview } from '@/lib/api';
import { Card, CardTitle, CardValue } from '@/components/ui/card';
import { RequestStream } from '@/components/RequestStream';
import { ManualConsole } from '@/components/ManualConsole';
import { OverviewMetrics } from '@/lib/types';

export default function OverviewPage() {
    const [metrics, setMetrics] = useState<OverviewMetrics>({
        total_requests: 0,
        actual_spend: 0,
        cost_avoided: 0,
        cache_hit_rate: 0
    });
    const [refreshSignal, setRefreshSignal] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshedAt, setLastRefreshedAt] = useState("");

    const load = useCallback(async () => {
        try {
            const data = await fetchOverview();
            setMetrics(data);
        } catch {
            // Ignore initial errors if backend isn't up yet
        }
    }, []);

    useEffect(() => {
        const initialLoad = window.setTimeout(load, 0);
        const interval = setInterval(load, 2000);
        
        const handleRefresh = () => window.setTimeout(load, 0);
        window.addEventListener('manual-refresh', handleRefresh);
        
        return () => {
            window.clearTimeout(initialLoad);
            clearInterval(interval);
            window.removeEventListener('manual-refresh', handleRefresh);
        };
    }, [load]);

    const triggerRefresh = async () => {
        setIsRefreshing(true);
        await load();
        const refreshedAt = new Date();
        setRefreshSignal(refreshedAt.getTime());
        setLastRefreshedAt(refreshedAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }));
        window.setTimeout(() => setIsRefreshing(false), 800);
    };

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10">
            {/* Top Quick Entry Bar */}
            <div className="flex justify-between items-center bg-[var(--color-surface)] p-4 rounded-lg border border-slate-700">
                <ManualConsole />
                <div className="flex flex-col items-end gap-1">
                    <button 
                        onClick={triggerRefresh}
                        disabled={isRefreshing}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700 disabled:opacity-60"
                    >
                        {isRefreshing ? "Refreshing..." : "Refresh Data"}
                    </button>
                    {lastRefreshedAt && (
                        <div className="text-xs text-emerald-400">
                            Updated {lastRefreshedAt}
                        </div>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardTitle>Total Requests</CardTitle>
                    <CardValue>{metrics.total_requests}</CardValue>
                </Card>
                <Card>
                    <CardTitle>Cache Hit Rate</CardTitle>
                    <CardValue trend="+18% this run">{metrics.cache_hit_rate.toFixed(1)}%</CardValue>
                </Card>
                <Card>
                    <CardTitle>Actual Spend</CardTitle>
                    <CardValue trend="-62% vs baseline">${metrics.actual_spend.toFixed(4)}</CardValue>
                </Card>
                <Card>
                    <CardTitle>Cost Avoided</CardTitle>
                    <CardValue trend="Routing + Caching savings">${metrics.cost_avoided.toFixed(4)}</CardValue>
                </Card>
            </div>

            {/* Live Stream */}
            <div>
                <h2 className="text-xl font-bold mb-4">Live Request Stream</h2>
                <RequestStream refreshSignal={refreshSignal} />
            </div>
        </div>
    );
}
