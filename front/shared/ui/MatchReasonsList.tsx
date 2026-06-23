'use client';

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
        <span className="rounded-full border-2 border-black bg-[#ffd9e0] px-3 py-2 text-xs font-black text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)]">
          ⚠️ {matchRisks[0]}
        </span>
      )}
    </div>
  );
}
