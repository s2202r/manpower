"use client";

import { getFillStatus, getFillStatusColor, getFillStatusLabel, formatPercent } from "@/lib/utils";
import { Users, UserCheck, UserCheck2 } from "lucide-react";

interface FillRateCardProps {
  requested: number;
  confirmed: number;
  checkedIn: number;
}

export function FillRateCard({ requested, confirmed, checkedIn }: FillRateCardProps) {
  const confirmRate = requested > 0 ? (confirmed / requested) * 100 : 0;
  const checkinRate = requested > 0 ? (checkedIn / requested) * 100 : 0;
  const fillRate = checkinRate; // primary metric
  const status = getFillStatus(fillRate);
  const color = getFillStatusColor(status);

  // Arc parameters
  const R = 52;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * R; // half circle
  const dashOffset = circumference * (1 - fillRate / 100);

  const arcPath = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;

  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}
      >
        Fill Rate
      </p>

      {/* Gauge */}
      <div className="flex items-end justify-center mb-4">
        <svg width="140" height="80" viewBox="0 0 140 80" aria-label={`Fill rate ${formatPercent(fillRate)}`}>
          {/* Track */}
          <path
            d={arcPath}
            fill="none"
            stroke="var(--border)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
          />
          {/* Center label */}
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="18"
            fontWeight="700"
            fill={color}
          >
            {formatPercent(fillRate, 0)}
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fontWeight="600"
            fill="var(--text-muted)"
            letterSpacing="0.08em"
          >
            {getFillStatusLabel(status).toUpperCase()}
          </text>
        </svg>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2">
        <FillRow
          icon={<Users size={13} />}
          label="Requested"
          count={requested}
          rate={100}
          color="var(--text-muted)"
        />
        <FillRow
          icon={<UserCheck size={13} />}
          label="Confirmed"
          count={confirmed}
          rate={confirmRate}
          color="#3B82F6"
        />
        <FillRow
          icon={<UserCheck2 size={13} />}
          label="Checked In"
          count={checkedIn}
          rate={checkinRate}
          color={color}
        />
      </div>
    </div>
  );
}

function FillRow({
  icon,
  label,
  count,
  rate,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  rate: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span style={{ color: "var(--text-muted)" }}>{icon}</span>
      <span className="text-xs w-20" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(rate, 100)}%`, background: color }}
        />
      </div>
      <span
        className="text-xs font-semibold tabular-nums w-6 text-right"
        style={{ color }}
      >
        {count}
      </span>
    </div>
  );
}
