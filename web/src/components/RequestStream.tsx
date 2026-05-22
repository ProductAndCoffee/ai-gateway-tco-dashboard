"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { fetchLiveRequests, fetchRequestDetail, replayPrompt } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { RequestModel, RequestDetailModel } from '@/lib/types';

export function RequestStream({ refreshSignal = 0 }: { refreshSignal?: number }) {
    const [requests, setRequests] = useState<RequestModel[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
    const [detail, setDetail] = useState<RequestDetailModel | null>(null);
    const [streamError, setStreamError] = useState<string | null>(null);

    const loadRequests = useCallback(async () => {
        try {
            const data = await fetchLiveRequests();
            setRequests(data);
            setStreamError(null);
        } catch {
            setStreamError("Backend offline. Start the FastAPI gateway on port 8000 to stream requests.");
        }
    }, []);

    useEffect(() => {
        const handleManual = (e: Event) => setSelectedRequest((e as CustomEvent).detail);
        window.addEventListener('manual-prompt-sent', handleManual);
        return () => window.removeEventListener('manual-prompt-sent', handleManual);
    }, []);

    useEffect(() => {
        const initialLoad = window.setTimeout(loadRequests, 0);
        const interval = setInterval(loadRequests, 1000);
        
        const handleRefresh = () => window.setTimeout(loadRequests, 0);
        window.addEventListener('manual-refresh', handleRefresh);
        
        return () => {
            window.clearTimeout(initialLoad);
            clearInterval(interval);
            window.removeEventListener('manual-refresh', handleRefresh);
        };
    }, [loadRequests]);

    useEffect(() => {
        if (refreshSignal > 0) {
            const refreshLoad = window.setTimeout(loadRequests, 0);
            return () => window.clearTimeout(refreshLoad);
        }
    }, [refreshSignal, loadRequests]);

    useEffect(() => {
        if (selectedRequest) {
            fetchRequestDetail(selectedRequest).then(setDetail).catch(console.error);
        }
    }, [selectedRequest]);

    const handleReplay = async () => {
        if (!selectedRequest) return;
        await replayPrompt(selectedRequest);
        // It will take a moment, the poller will catch it
    };

    return (
        <div className="flex w-full gap-4 relative">
            <div className="flex-1 overflow-x-auto border border-slate-800 rounded-lg bg-[var(--color-surface)]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-800/50 text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium">Time</th>
                            <th className="px-4 py-3 font-medium">App</th>
                            <th className="px-4 py-3 font-medium">Prompt Snippet</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Model</th>
                            <th className="px-4 py-3 font-medium">Latency</th>
                            <th className="px-4 py-3 font-medium">Cost</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {streamError ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-amber-300 bg-amber-500/5">
                                    {streamError}
                                </td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                                    Ready for Simulation. No recent traffic.
                                </td>
                            </tr>
                        ) : null}
                        {requests.map(r => (
                            <tr 
                                key={r.id} 
                                className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                                onClick={() => setSelectedRequest(r.id)}
                            >
                                <td className="px-4 py-3 text-slate-400">{r.time}</td>
                                <td className="px-4 py-3">{r.app}</td>
                                <td className="px-4 py-3 max-w-[200px] truncate text-slate-300">
                                    {r.prompt}
                                </td>
                                <td className="px-4 py-3"><Badge status={r.status}>{r.status}</Badge></td>
                                <td className="px-4 py-3 text-slate-400">{r.routed_model}</td>
                                <td className="px-4 py-3 font-mono">{r.latency}ms</td>
                                <td className="px-4 py-3 font-mono">${r.cost.toFixed(5)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Request Detail Drawer */}
            {selectedRequest && (
                <div className="w-96 border border-slate-700 bg-slate-900 rounded-lg flex flex-col h-[600px] shadow-xl sticky top-0 right-0 z-10 animate-in slide-in-from-right-4 duration-200">
                    <div className="flex justify-between items-center p-4 border-b border-slate-800">
                        <h2 className="font-bold">Request Detail</h2>
                        <button onClick={() => { setSelectedRequest(null); setDetail(null); }} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    
                    <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6 text-sm">
                        {detail ? (
                            <>
                                <div>
                                    <div className="text-slate-400 mb-1">Prompt</div>
                                    <div className="bg-black/30 p-3 rounded border border-slate-800 whitespace-pre-wrap">
                                        {detail.prompt}
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-slate-400 mb-1">Cache Decision</div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge status={detail.cache_hit ? "CACHE HIT" : "CACHE MISS"}>
                                            {detail.cache_hit ? "CACHE HIT" : "CACHE MISS"}
                                        </Badge>
                                        <span className="text-xs text-slate-500">Similarity: {detail.similarity_score.toFixed(3)}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-slate-400 mb-1">Routing Policy</div>
                                    <div className="bg-black/30 p-3 rounded border border-slate-800">
                                        <div className="text-[var(--color-purple-500)] mb-1 font-medium">{detail.routed_model}</div>
                                        <div className="text-slate-300 text-xs italic">{detail.routing_reason}</div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-slate-400 mb-1">Tokens</div>
                                        <div>In: {detail.tokens_prompt}</div>
                                        <div>Out: {detail.tokens_completion}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 mb-1">Economics</div>
                                        <div>Cost: ${detail.cost.toFixed(5)}</div>
                                        <div className="text-[var(--color-emerald-500)]">Saved: ${detail.routing_savings.toFixed(5)}</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-slate-500 py-10">Loading details...</div>
                        )}
                    </div>
                    
                    <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                        <button 
                            onClick={handleReplay}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-md transition-colors"
                        >
                            Replay Prompt
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
