import React, { useState } from 'react';
import { ArrowRight, DollarSign, Flame, TrendingUp } from 'lucide-react';
import { CustomSlider } from './CustomControls.tsx';
import { SourceBadge } from './SourceBadge.tsx';
import type { ProfitabilityDatabase } from '../types.ts';

interface ProfitabilityLedgerProps {
  data: ProfitabilityDatabase | null;
  onNavigateSources?: () => void;
}

export const ProfitabilityLedger: React.FC<ProfitabilityLedgerProps> = ({ data, onNavigateSources }) => {
  const [simInfraB, setSimInfraB] = useState(520);
  const [simSoftwareB, setSimSoftwareB] = useState(98);

  if (!data) {
    return (
      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 text-center text-xs text-[var(--text-secondary)]">
        Loading macro AI P&amp;L ledger...
      </div>
    );
  }

  const maxCapex = Math.max(...data.yearlyLedger.map((y) => y.hyperscalerCapexB), 550);
  const deficitB = simInfraB - simSoftwareB;
  const ratio = simSoftwareB > 0 ? simInfraB / simSoftwareB : 99;
  const softwareCoveragePct = Math.min(100, Math.round((simSoftwareB / Math.max(1, simInfraB)) * 100));

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-4">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#059669] uppercase"><TrendingUp className="h-3.5 w-3.5" /> Silicon &amp; Infra Layer</div>
            <div className="mt-1.5 text-base font-semibold text-[var(--text-primary)]">{data.verdictInfra}</div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Chipmakers &amp; HBM suppliers capture 70%+ gross margins on immediate hyperscaler GPU orders.
            </p>
          </div>

          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-4">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#DC2626] uppercase"><Flame className="h-3.5 w-3.5" /> Model &amp; Application Layer</div>
            <div className="mt-1.5 text-base font-semibold text-[var(--text-primary)]">{data.verdictModelLayer}</div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Frontier training + inference compute burn exceeds realized end-user software/API revenue.
            </p>
          </div>

          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-4">
            <div className="text-[11px] font-semibold text-[#D97706] uppercase">CapEx-to-Revenue Deficit Gauge</div>
            <div className="tabular-mono mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">${data.annualCapexRunRateB}B</span>
              <span className="text-xs text-[var(--text-secondary)]">spent vs.</span>
              <span className="text-xl font-bold text-[#059669]">${data.annualRealizedSoftwareRevB}B</span>
              <span className="text-xs text-[var(--text-secondary)]">earned</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-[var(--bg-elevated)]">
              <div
                className="h-full bg-[#059669]"
                style={{ width: `${Math.min(100, (data.annualRealizedSoftwareRevB / data.annualCapexRunRateB) * 100)}%` }}
              />
            </div>
            <div className="tabular-mono mt-1.5 flex justify-between text-[10px] text-[var(--text-secondary)]">
              <span>{data.infraToSoftwareRatio}x Infra/Software Ratio</span>
              <span>Est. Breakeven: {data.estBreakevenYear}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Annual AI CapEx vs. Silicon Profit vs. Software Revenue ($B)
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Macro P&amp;L gap from 2023 through 2026 annualized run-rate.
              </p>
            </div>
            <div className="tabular-mono flex flex-wrap gap-3 text-[10px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 bg-[#D97706]" /> CapEx</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 bg-[#0891B2]" /> Silicon Profit</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 bg-[#059669]" /> Software Rev</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 bg-[#DC2626]" /> Frontier Burn</span>
            </div>
          </div>

          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
            <svg viewBox="0 0 680 260" className="h-64 w-full">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = 220 - t * 185;
                return (
                  <g key={t}>
                    <line x1={48} y1={y} x2={660} y2={y} stroke="var(--border-hairline)" strokeDasharray="3 4" />
                    <text x={40} y={y + 3} textAnchor="end" className="tabular-mono fill-[var(--text-muted)] text-[10px]">
                      ${Math.round(t * maxCapex)}B
                    </text>
                  </g>
                );
              })}

              {data.yearlyLedger.map((row, idx) => {
                const groupX = 85 + idx * 145;
                const barW = 24;
                const scale = (v: number) => (v / maxCapex) * 185;
                const bars = [
                  { val: row.hyperscalerCapexB, color: '#D97706', dx: 0 },
                  { val: row.siliconProfitB, color: '#0891B2', dx: 28 },
                  { val: row.modelAppRevenueB, color: '#059669', dx: 56 },
                  { val: row.frontierBurnB, color: '#DC2626', dx: 84 },
                ];

                return (
                  <g key={row.year}>
                    {bars.map((b, bi) => {
                      const h = scale(b.val);
                      const y = 220 - h;
                      return (
                        <g key={bi}>
                          <rect x={groupX + b.dx} y={y} width={barW} height={h} rx={2} fill={b.color} fillOpacity={0.85} />
                          <text x={groupX + b.dx + barW / 2} y={y - 5} textAnchor="middle" className="tabular-mono fill-[var(--text-secondary)] text-[9px]">
                            ${b.val}
                          </text>
                        </g>
                      );
                    })}
                    <text x={groupX + 54} y={242} textAnchor="middle" className="tabular-mono fill-[var(--text-primary)] text-[11px] font-semibold">
                      {row.year}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]"><DollarSign className="h-4 w-4" /> Unit Economics Simulator</div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Model annual AI infra spend vs. end-user software revenue payback.
          </p>

          <div className="tabular-mono mt-4 space-y-4 text-xs">
            <div>
              <div className="mb-1 flex justify-between text-[var(--text-secondary)]">
                <span>Annual AI Infra Spend</span>
                <span className="font-bold text-[var(--text-primary)]">${simInfraB}B</span>
              </div>
              <CustomSlider min={100} max={900} step={10} value={simInfraB} onChange={setSimInfraB} accentColor="#D97706" />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[var(--text-secondary)]">
                <span>Realized Software Revenue</span>
                <span className="font-bold text-[#059669]">${simSoftwareB}B</span>
              </div>
              <CustomSlider min={20} max={700} step={5} value={simSoftwareB} onChange={setSimSoftwareB} accentColor="#059669" />
            </div>

            <div className="space-y-2 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3">
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Spend / Rev Ratio:</span><span className="font-bold">{ratio.toFixed(2)}x</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Software Coverage:</span><span className="font-bold">{softwareCoveragePct}%</span></div>
              <div className="flex justify-between border-t border-[var(--border-hairline)] pt-2">
                <span className="text-[var(--text-secondary)]">Net Gap:</span>
                <span className={`font-bold ${deficitB > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                  {deficitB > 0 ? `-$${deficitB}B Deficit` : `+$${Math.abs(deficitB)}B Surplus`}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
        <div className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Circular Financing &amp; Compute Credit Flows
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.circularDeals.map((deal) => (
            <div key={deal.id} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                  <span>{deal.from}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <span>{deal.to}</span>
                </div>
                <span className="tabular-mono rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-0.5 text-xs font-bold text-[#059669]">
                  ${deal.amountB}B
                </span>
              </div>
              <div className="mt-1.5 text-xs font-medium text-[var(--text-primary)]">{deal.mechanism}</div>
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{deal.description}</p>
            </div>
          ))}
        </div>
        <SourceBadge sources={['SEC Filings', 'TrendForce']} onNavigateSources={onNavigateSources} className="mt-3" />
      </section>
    </div>
  );
};
