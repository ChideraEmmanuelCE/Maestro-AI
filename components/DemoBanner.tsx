"use client";

import { Sparkles } from "lucide-react";

interface DemoBannerProps {
  onExit: () => void;
}

export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <div className="demo-banner" role="status">
      <Sparkles size={15} />
      <span>
        You are in <strong>Demo mode</strong> — progress stays on this device.
      </span>
      <button type="button" className="demo-banner-cta" onClick={onExit}>
        Exit demo
      </button>
    </div>
  );
}
