import React from 'react';

export type DeltaTone = 'positive' | 'negative' | 'caution' | 'neutral';

const TONE_COLORS: Record<DeltaTone, { stroke: string; fill: string; text: string; badgeBg: string; badgeBorder: string }> = {
  positive: {
    stroke: '#10B981',
    fill: 'rgba(16, 185, 129, 0.14)',
    text: 'text-[#059669] dark:text-[#34D399]',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/25',
  },
  negative: {
    stroke: '#F43F5E',
    fill: 'rgba(244, 63, 94, 0.14)',
    text: 'text-[#E11D48] dark:text-[#FB7185]',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/25',
  },
  caution: {
    stroke: '#D97706',
    fill: 'rgba(217, 119, 6, 0.14)',
    text: 'text-[#B45309] dark:text-[#FBBF24]',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/25',
  },
  neutral: {
    stroke: '#64748B',
    fill: 'rgba(100, 116, 139, 0.12)',
    text: 'text-[var(--text-secondary)]',
    badgeBg: 'bg-[var(--bg-sub)]',
    badgeBorder: 'border-[var(--border-hairline)]',
  },
};

interface SparklineProps {
  values: number[];
  tone?: DeltaTone;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  tone = 'neutral',
  width = 88,
  height = 24,
  className = '',
  ariaLabel,
}) => {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) return null;

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const padX = 2;
  const padY = 3;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const pts = clean.map((v, i) => {
    const x = padX + (i / (clean.length - 1)) * innerW;
    const y = padY + innerH - ((v - min) / range) * innerH;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))] as const;
  });

  const linePath = pts.map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${height - 1} L${pts[0][0]},${height - 1} Z`;
  const palette = TONE_COLORS[tone];
  const last = pts[pts.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`shrink-0 overflow-visible ${className}`}
      role="img"
      aria-label={ariaLabel ?? 'Trend sparkline'}
    >
      <path d={areaPath} fill={palette.fill} />
      <path d={linePath} fill="none" stroke={palette.stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill={palette.stroke} />
    </svg>
  );
};

interface DeltaBadgeProps {
  value: number | null;
  suffix?: string;
  decimals?: number;
  invertGood?: boolean;
  compact?: boolean;
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({
  value,
  suffix = '%',
  decimals = 1,
  invertGood = false,
  compact = false,
}) => {
  if (value === null || !Number.isFinite(value)) {
    return <span className="tabular-mono text-[10px] text-[var(--text-muted)]">-</span>;
  }

  const isZero = Math.abs(value) < 0.0001;
  const isUp = value > 0;
  const tone: DeltaTone = isZero
    ? 'neutral'
    : (isUp && !invertGood) || (!isUp && invertGood)
      ? 'positive'
      : 'negative';
  const palette = TONE_COLORS[tone];
  const arrow = isZero ? '-' : isUp ? '▲' : '▼';
  const formatted = `${isUp ? '+' : ''}${value.toFixed(decimals)}${suffix}`;

  if (compact) {
    return (
      <span className={`tabular-mono inline-flex items-center gap-0.5 text-[10px] font-semibold ${palette.text}`}>
        <span aria-hidden="true">{arrow}</span>
        <span>{formatted}</span>
      </span>
    );
  }

  return (
    <span
      className={`tabular-mono inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${palette.badgeBg} ${palette.badgeBorder} ${palette.text}`}
    >
      <span aria-hidden="true">{arrow}</span>
      <span>{formatted}</span>
    </span>
  );
};

interface ComputeCapitalFlowDiagramProps {
  capexB: number;
  softwareRevB: number;
  ratio: number;
  dramSharePct: number;
  openWeightCount: number;
  closedWeightCount: number;
}

export const ComputeCapitalFlowDiagram: React.FC<ComputeCapitalFlowDiagramProps> = ({
  capexB,
  softwareRevB,
  ratio,
  dramSharePct,
  openWeightCount,
  closedWeightCount,
}) => {
  return (
    <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
            Compute, Capital &amp; Execution Flow
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)]">
            How upstream silicon CapEx flows into cloud API margins vs. open-weight local execution.
          </p>
        </div>
        <span className="tabular-mono rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
          CAPEX / REV RATIO: <strong className="text-[#E11D48] dark:text-[#FB7185]">{ratio.toFixed(1)}x</strong>
        </span>
      </div>

      <svg
        viewBox="0 0 860 170"
        className="w-full h-auto"
        role="img"
        aria-label="Compute, Capital and Execution Flow Diagram"
      >
        <defs>
          <marker id="flowArrowAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
          </marker>
          <marker id="flowArrowEmerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
          </marker>
          <marker id="flowArrowRose" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#F43F5E" />
          </marker>
        </defs>

        {/* Node 1: Silicon & CapEx */}
        <rect x="10" y="24" width="235" height="122" rx="8" fill="var(--bg-sub)" stroke="var(--border-strong)" strokeWidth="1.2" />
        <text x="24" y="47" fontSize="10" fontWeight="700" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
          01. SILICON &amp; CAPEX SUPPLY
        </text>
        <text x="24" y="72" fontSize="18" fontWeight="700" fill="#D97706" fontFamily="JetBrains Mono, monospace">
          ${capexB}B / yr
        </text>
        <text x="24" y="92" fontSize="11" fill="var(--text-secondary)" fontFamily="Inter, sans-serif">
          Hyperscaler GPU + Power Buildout
        </text>
        <text x="24" y="114" fontSize="10" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
          AI DRAM Wafer Share: {dramSharePct}%
        </text>
        <text x="24" y="131" fontSize="10" fill="#10B981" fontFamily="JetBrains Mono, monospace">
          ▲ Silicon Margin Capture (~74%)
        </text>

        {/* Connector 1 -> 2 */}
        <path d="M 245 64 L 308 64" stroke="#F43F5E" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#flowArrowRose)" />
        <text x="252" y="55" fontSize="9" fill="#FB7185" fontFamily="JetBrains Mono, monospace">
          CapEx Burn
        </text>

        {/* Connector 1 -> 3 */}
        <path d="M 245 106 L 308 106" stroke="#10B981" strokeWidth="2" markerEnd="url(#flowArrowEmerald)" />
        <text x="250" y="122" fontSize="9" fill="#34D399" fontFamily="JetBrains Mono, monospace">
          Weight Drops
        </text>

        {/* Node 2: Cloud / API Layer */}
        <rect x="314" y="16" width="250" height="66" rx="8" fill="var(--bg-sub)" stroke="var(--border-hairline)" strokeWidth="1.2" />
        <text x="328" y="36" fontSize="10" fontWeight="700" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
          02A. CLOUD &amp; API INFERENCE ({closedWeightCount} CLOSED)
        </text>
        <text x="328" y="57" fontSize="13" fontWeight="700" fill="var(--text-primary)" fontFamily="JetBrains Mono, monospace">
          ${softwareRevB}B Rev
        </text>
        <text x="415" y="57" fontSize="10" fill="#FB7185" fontFamily="JetBrains Mono, monospace">
          ▼ {ratio.toFixed(1)}x CapEx Gap
        </text>
        <text x="328" y="72" fontSize="10" fill="var(--text-secondary)" fontFamily="Inter, sans-serif">
          Hosted frontier reasoning, token-metered
        </text>

        {/* Node 3: Open-Weight / Local */}
        <rect x="314" y="92" width="250" height="66" rx="8" fill="var(--bg-sub)" stroke="var(--border-hairline)" strokeWidth="1.2" />
        <text x="328" y="112" fontSize="10" fontWeight="700" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
          02B. OPEN-WEIGHT &amp; LOCAL ({openWeightCount} OPEN)
        </text>
        <text x="328" y="133" fontSize="13" fontWeight="700" fill="#10B981" fontFamily="JetBrains Mono, monospace">
          ▲ Zero Per-Token Fee
        </text>
        <text x="328" y="148" fontSize="10" fill="var(--text-secondary)" fontFamily="Inter, sans-serif">
          FP8 / Q4_K_M edge &amp; private cluster TCO
        </text>

        {/* Connectors -> Outcome */}
        <path d="M 564 49 L 615 74" stroke="#D97706" strokeWidth="1.8" markerEnd="url(#flowArrowAmber)" />
        <path d="M 564 125 L 615 98" stroke="#10B981" strokeWidth="1.8" markerEnd="url(#flowArrowEmerald)" />

        {/* Node 4: End-User / Enterprise */}
        <rect x="620" y="24" width="230" height="122" rx="8" fill="var(--bg-sub)" stroke="var(--border-strong)" strokeWidth="1.2" />
        <text x="634" y="47" fontSize="10" fontWeight="700" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
          03. VERIFIED OUTCOMES
        </text>
        <text x="634" y="71" fontSize="12" fontWeight="600" fill="var(--text-primary)" fontFamily="Inter, sans-serif">
          Intelligence / Dollar Curve
        </text>
        <text x="634" y="92" fontSize="10" fill="#10B981" fontFamily="JetBrains Mono, monospace">
          ▲ API Cost Deflation / IQ
        </text>
        <text x="634" y="111" fontSize="10" fill="#FB7185" fontFamily="JetBrains Mono, monospace">
          ▼ Grid Power &amp; DRAM Inflation
        </text>
        <text x="634" y="132" fontSize="10" fill="var(--text-secondary)" fontFamily="Inter, sans-serif">
          Grounded telemetry, zero hype.
        </text>
      </svg>
    </div>
  );
};
