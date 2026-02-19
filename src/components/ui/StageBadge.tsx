"use client";

interface StageBadgeProps {
  label: string;
  variant?: "default" | "amber" | "muted";
}

export default function StageBadge({
  label,
  variant = "default",
}: StageBadgeProps) {
  const styles = {
    default:
      "border-border text-text-muted",
    amber:
      "border-primary/40 text-primary bg-primary-dim",
    muted:
      "border-border text-text-muted/50",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-mono uppercase tracking-wider border rounded ${styles[variant]}`}
    >
      {label}
    </span>
  );
}
