"use client";
import React, { useState } from 'react';
import { manualPrompt } from '@/lib/api';

export function ManualConsole() {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // For demo, we hardcode support-bot's app_id and api_key.
    // In a full implementation, this could be selectable.
    const appId = "support-bot";
    const apiKey = "key_1";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            setError("Prompt cannot be empty.");
            setSuccess("");
            return;
        }
        
        setIsLoading(true);
        setError("");
        setSuccess("");
        
        try {
            const requestId = await manualPrompt(appId, apiKey, prompt);
            setSuccess("Prompt submitted.");
            window.dispatchEvent(new CustomEvent('manual-prompt-sent', { detail: requestId }));
            window.dispatchEvent(new CustomEvent('manual-refresh'));
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to send prompt");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl items-start">
            <div className="flex-1">
                <div className="flex gap-2">
                    <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-md text-sm font-medium flex items-center whitespace-nowrap">
                        Manual &gt; {appId}
                    </span>
                    <input 
                        type="text" 
                        value={prompt}
                        onChange={e => {
                            setPrompt(e.target.value);
                            setSuccess("");
                        }}
                        placeholder="Ask interviewer for a prompt..." 
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        disabled={isLoading}
                    />
                </div>
                {error && <div className="text-red-400 text-xs mt-1 ml-32">{error}</div>}
                {success && <div className="text-emerald-400 text-xs mt-1 ml-32">{success}</div>}
                <div className="text-slate-500 text-xs mt-1 ml-32">Do not enter secrets or personal data.</div>
            </div>
            
            <button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 min-w-[120px]"
            >
                {isLoading ? "Sending..." : "Send Prompt"}
            </button>
        </form>
    );
}
