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
  braindump: "Brain Dump",
  prioritize: "Prioritize",
  decompose: "Decompose",
  estimate: "Estimate",
  pomosize: "Pomo-size",
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

      {/* Stage Progress */}
      <div className="border-b border-border bg-surface/30">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`w-8 h-px ${
                      i <= currentIndex ? "bg-primary/50" : "bg-border"
                    }`}
                  />
                )}
                <button
                  onClick={() => i <= currentIndex && setStage(s)}
                  className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                    s === stage
                      ? "bg-primary-dim text-primary"
                      : i < currentIndex
                      ? "text-primary/50 hover:text-primary"
                      : "text-text-muted/40 cursor-default"
                  }`}
                >
                  {STAGE_NAMES[s]}
                </button>
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
