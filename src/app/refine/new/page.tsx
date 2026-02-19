"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import BrainDump from "@/components/stages/BrainDump";
import Prioritize from "@/components/stages/Prioritize";
import Decompose from "@/components/stages/Decompose";
import Estimate from "@/components/stages/Estimate";
import PomoSize from "@/components/stages/PomoSize";

const STAGES = ["braindump", "prioritize", "decompose", "estimate", "pomosize"] as const;
type RefinementStage = (typeof STAGES)[number];

const STAGE_NAMES: Record<RefinementStage, string> = {
  braindump: "DUMP",
  prioritize: "PRIORITIZE",
  decompose: "DECOMPOSE",
  estimate: "ESTIMATE",
  pomosize: "POMO-SIZE",
};

export default function NewRefinementPage() {
  const [stage, setStage] = useState<RefinementStage>("braindump");

  const currentIndex = STAGES.indexOf(stage);

  const goNext = () => {
    if (currentIndex < STAGES.length - 1) {
      setStage(STAGES[currentIndex + 1]);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setStage(STAGES[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Stage Progress Bar */}
      <div className="border-b border-border bg-surface/30">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {STAGES.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                {/* Step Circle + Label */}
                <button
                  onClick={() => i <= currentIndex && setStage(s)}
                  className={`flex items-center gap-2 ${
                    i <= currentIndex ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                      s === stage
                        ? "bg-primary text-background"
                        : i < currentIndex
                        ? "bg-primary-dim text-primary"
                        : "bg-surface border border-border text-text-muted/40"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`font-mono text-xs uppercase tracking-wider font-bold hidden sm:inline transition-colors ${
                      s === stage
                        ? "text-primary"
                        : i < currentIndex
                        ? "text-primary/50"
                        : "text-text-muted/30"
                    }`}
                  >
                    {STAGE_NAMES[s]}
                  </span>
                </button>

                {/* Connector Line */}
                {i < STAGES.length - 1 && (
                  <div className="flex-1 mx-3">
                    <div
                      className={`h-px transition-colors ${
                        i < currentIndex ? "bg-primary/40" : "bg-border"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage Content */}
      {stage === "braindump" && <BrainDump onNext={goNext} />}
      {stage === "prioritize" && (
        <Prioritize onNext={goNext} onBack={goBack} />
      )}
      {stage === "decompose" && (
        <Decompose onNext={goNext} onBack={goBack} />
      )}
      {stage === "estimate" && <Estimate onNext={goNext} onBack={goBack} />}
      {stage === "pomosize" && (
        <PomoSize
          onNext={() => {
            window.location.href = "/plan";
          }}
          onBack={goBack}
        />
      )}
    </div>
  );
}
