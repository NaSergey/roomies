'use client';

import { Glass } from '@samasante/liquid-glass';

interface MatchReasonsListProps {
  matchReasons: string[];
  matchRisks?: string[];
}

export function MatchReasonsList({ matchReasons, matchRisks }: MatchReasonsListProps) {
  if (matchReasons.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {matchReasons.map((reason, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-[#14140f]">
          <span>✨</span>
          <span className="font-normal leading-snug">{reason}</span>
        </div>
      ))}
      {matchRisks?.[0] && (
        <Glass
          className="rounded-full px-3 py-2 text-xs font-black text-[#14140f]"
          style={{ background: 'rgba(255,217,224,0.3)' }}
          optics={{ frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 }}
        >
          ⚠️ {matchRisks[0]}
        </Glass>
      )}
    </div>
  );
}
