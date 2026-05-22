import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "AI Gateway Simulator",
  description: "TCO and Semantic Caching Simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans flex min-h-screen bg-[var(--color-background)] text-white`}>
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto h-screen">
            {children}
        </main>
      </body>
    </html>
  );
}
