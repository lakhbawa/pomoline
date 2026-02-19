"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isRefine = pathname.startsWith("/refine");
  const isPlan = pathname.startsWith("/plan");

  return (
    <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono font-bold text-primary text-lg">
            pomoline
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/refine"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isRefine
                ? "bg-primary-dim text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Refine
          </Link>
          <Link
            href="/plan"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isPlan
                ? "bg-primary-dim text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Plan
          </Link>
        </nav>
      </div>
    </header>
  );
}
