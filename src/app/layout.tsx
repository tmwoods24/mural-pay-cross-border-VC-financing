import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Borderless Raise",
  description: "Cross-border venture financing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <a href="/" className="text-indigo-600 font-bold text-lg tracking-tight">
            Borderless Raise
          </a>
          <div className="flex items-center gap-6">
            <a href="/startup/onboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              For Startups
            </a>
            <a href="/investor/deals" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Deals
            </a>
            <a href="/admin" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Admin
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
