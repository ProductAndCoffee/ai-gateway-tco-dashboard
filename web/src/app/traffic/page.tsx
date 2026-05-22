"use client";
import React from 'react';
import { RequestStream } from '@/components/RequestStream';

export default function TrafficPage() {
    return (
        <div className="max-w-7xl mx-auto pb-10">
            <h1 className="text-2xl font-bold mb-6">Live Traffic</h1>
            <p className="text-slate-400 mb-8">Granular view of all incoming requests to the AI Gateway.</p>

            <RequestStream />
        </div>
    );
}
