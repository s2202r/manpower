import { getReliabilityColor, getReliabilityTier } from "@/lib/utils";

interface ReliabilityBadgeProps {
  score: number;
  showLabel?: boolean;
}

export function ReliabilityBadge({ score, showLabel = false }: ReliabilityBadgeProps) {
  const color = getReliabilityColor(score);
  const tier = getReliabilityTier(score);

  const tierLabel = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
  }[tier];

  return (
    <div className="flex items-center gap-1.5">
      {/* Mini arc indicator */}
      <svg width="28" height="16" viewBox="0 0 28 16" aria-label={`Reliability ${score}`}>
        <path
          d="M 2 14 A 12 12 0 0 1 26 14"
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 2 14 A 12 12 0 0 1 26 14"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 37.7} 37.7`}
          style={{ transition: "stroke-dasharray 0.4s ease" }}
        />
      </svg>
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color }}
      >
        {score}
      </span>
      {showLabel && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {tierLabel}
        </span>
      )}
    </div>
  );
}
