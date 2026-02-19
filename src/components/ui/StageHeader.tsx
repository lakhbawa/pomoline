"use client";

interface StageHeaderProps {
  stageNumber: number;
  totalStages?: number;
  title: string;
  description: string;
  progress: number; // 0-100
}

export default function StageHeader({
  stageNumber,
  totalStages = 6,
  title,
  description,
  progress,
}: StageHeaderProps) {
  return (
    <div className="mb-8">
      <p className="text-primary font-mono text-xs tracking-widest mb-2">
        STAGE {stageNumber} OF {totalStages}
      </p>
      <h1 className="font-mono font-bold text-3xl text-text-primary mb-3">
        {title}
      </h1>
      {/* Progress bar */}
      <div className="w-full h-1 bg-border rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}
