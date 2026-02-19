"use client";

import { ReactNode } from "react";

interface FooterBarProps {
  stats: { label: string; value: string | number }[];
  leftAction?: ReactNode;
  rightAction?: ReactNode;
}

export default function FooterBar({
  stats,
  leftAction,
  rightAction,
}: FooterBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {leftAction}
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-text-muted text-xs font-mono uppercase tracking-wider">
                {stat.label}
              </span>
              <span className="font-mono font-bold text-text-primary text-sm">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">{rightAction}</div>
      </div>
    </div>
  );
}
