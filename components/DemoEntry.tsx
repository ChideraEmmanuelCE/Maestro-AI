"use client";

import { Sparkles } from "lucide-react";

type AgeBand = "4-8" | "9-16" | "adult";

interface DemoEntryProps {
  onStartDemo: (ageBand: AgeBand) => void;
}

export function DemoEntry({ onStartDemo }: DemoEntryProps) {
  return (
    <div className="demo-entry">
      <p className="demo-label">Want to explore first?</p>
      <button
        type="button"
        className="outline-button demo-button"
        onClick={() => onStartDemo("adult")}
      >
        <Sparkles size={16} /> Try a lesson without an account
      </button>
      <button
        type="button"
        className="ghost-button demo-toddler"
        onClick={() => onStartDemo("4-8")}
      >
        Or try Toddler Mode (parent-guided)
      </button>
    </div>
  );
}
