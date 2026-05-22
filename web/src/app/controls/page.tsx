"use client";
import React, { useState } from 'react';
import { runScenario, resetDemo, clearCache, exportReport } from '@/lib/api';
import { ManualConsole } from '@/components/ManualConsole';
import { Card } from '@/components/ui/card';

export default function ControlsPage() {
    const [runningScenario, setRunningScenario] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState("");
    const [reportPreview, setReportPreview] = useState("");

    const handleRun = async (scenarioId: string) => {
        setRunningScenario(scenarioId);
        setActionMessage("");
        try {
            await runScenario(scenarioId);
            setActionMessage(`${scenarioId.replace("_", " ")} started. Check Overview or Live Traffic for new rows.`);
            setTimeout(() => setRunningScenario(null), 2000);
        } catch {
            setActionMessage("Failed to run scenario.");
            setRunningScenario(null);
        }
    };

    const handleReset = async () => {
        if (confirm("Reset the entire demo? This will clear all traffic and cache.")) {
            await resetDemo();
            setActionMessage("Demo data reset.");
            window.dispatchEvent(new CustomEvent('manual-refresh'));
        }
    };

    const handleClearCache = async () => {
        await clearCache();
        setActionMessage("Cache cleared. Request logs remain available.");
    };

    const handleExport = async () => {
        try {
            const data = await exportReport();
            const reportText = JSON.stringify(data, null, 2);
            const blob = new Blob([reportText], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'demo-report.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            setReportPreview(reportText);
            setActionMessage("Demo report generated. If the browser blocks downloads, use the preview below.");
        } catch {
            setActionMessage("Failed to generate demo report.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <h1 className="text-2xl font-bold mb-6">Demo Controls</h1>
            <p className="text-slate-400 mb-8">Presenter panel to manually drive the simulation narrative.</p>
            {actionMessage && (
                <div className="mb-6 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {actionMessage}
                </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Scenarios */}
                <Card>
                    <h2 className="text-lg font-bold mb-4">Simulation Scenarios</h2>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center p-3 border border-slate-700 rounded bg-slate-800/30">
                            <div>
                                <div className="font-medium text-white">Semantic Cache Savings</div>
                                <div className="text-xs text-slate-400">Fires two similar requests to prove cache hit.</div>
                            </div>
                            <button 
                                onClick={() => handleRun("scenario_1")}
                                disabled={runningScenario !== null}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm transition-colors"
                            >
                                {runningScenario === "scenario_1" ? "Running..." : "Run"}
                            </button>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 border border-slate-700 rounded bg-slate-800/30">
                            <div>
                                <div className="font-medium text-white">Dynamic Routing</div>
                                <div className="text-xs text-slate-400">Routes simple tasks to Gemini, complex to GPT-4.</div>
                            </div>
                            <button 
                                onClick={() => handleRun("scenario_2")}
                                disabled={runningScenario !== null}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm transition-colors"
                            >
                                {runningScenario === "scenario_2" ? "Running..." : "Run"}
                            </button>
                        </div>

                        <div className="flex justify-between items-center p-3 border border-slate-700 rounded bg-slate-800/30">
                            <div>
                                <div className="font-medium text-white">Rate Limit Breach</div>
                                <div className="text-xs text-slate-400">Floods Rogue App to trigger HTTP 429.</div>
                            </div>
                            <button 
                                onClick={() => handleRun("scenario_3")}
                                disabled={runningScenario !== null}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm transition-colors"
                            >
                                {runningScenario === "scenario_3" ? "Running..." : "Run"}
                            </button>
                        </div>

                        <div className="flex justify-between items-center p-3 border border-slate-700 rounded bg-slate-800/30">
                            <div>
                                <div className="font-medium text-white">Cache Bypass (Live Data)</div>
                                <div className="text-xs text-slate-400">Bypasses cache for real-time stock query.</div>
                            </div>
                            <button 
                                onClick={() => handleRun("scenario_4")}
                                disabled={runningScenario !== null}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm transition-colors"
                            >
                                {runningScenario === "scenario_4" ? "Running..." : "Run"}
                            </button>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col gap-6">
                    {/* Settings */}
                    <Card>
                        <h2 className="text-lg font-bold mb-4">Global Settings</h2>
                        <div className="mb-4">
                            <label className="flex justify-between text-sm text-slate-300 mb-2">
                                <span>Cache Similarity Threshold</span>
                                <span>0.90</span>
	                            </label>
	                            <input type="range" min="0" max="1" step="0.01" defaultValue="0.90" className="w-full accent-blue-500" disabled />
	                            <div className="text-xs text-slate-500 mt-1">Fixed at 0.90 for MVP. Active tuning is a future extension.</div>
	                        </div>
                        <div className="pt-4 border-t border-slate-700 flex gap-4">
                            <button 
                                onClick={handleReset}
                                className="w-full border border-red-500/50 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded transition-colors font-medium text-sm"
                            >
                                Reset Demo Data
                            </button>
                            <button 
                                onClick={handleClearCache}
                                className="w-full border border-slate-600 text-slate-300 hover:bg-slate-800 px-4 py-2 rounded transition-colors font-medium text-sm"
                            >
                                Clear Cache Only
                            </button>
                        </div>
                    </Card>

                    {/* Report Export */}
                    <Card>
                        <h2 className="text-lg font-bold mb-4">Export Demo Report</h2>
                        <p className="text-sm text-slate-400 mb-4">Download a JSON summary of the session&apos;s performance.</p>
	                        <button 
	                            onClick={handleExport}
	                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded transition-colors font-medium text-sm"
	                        >
	                            Download Report
	                        </button>
	                        {reportPreview && (
	                            <pre className="mt-4 max-h-48 overflow-auto rounded border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-300">
	                                {reportPreview}
	                            </pre>
	                        )}
	                    </Card>

                    {/* Manual entry */}
                    <Card>
                        <h2 className="text-lg font-bold mb-4">Manual Test Console</h2>
                        <ManualConsole />
                    </Card>
                </div>
            </div>
        </div>
    );
}
