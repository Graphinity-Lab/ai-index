import React from 'react';
import { Building2, Cpu, TrendingUp } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { SourceBadge } from './SourceBadge.tsx';
import { DeltaBadge, Sparkline } from './TelemetryVisuals.tsx';
import type { MarketDatabase } from '../types.ts';

interface MarketsWarRoomProps {
  market: MarketDatabase | null;
  onNavigateSources?: () => void;
}

export const MarketsWarRoom: React.FC<MarketsWarRoomProps> = ({ market, onNavigateSources }) => {
  if (!market) {
    return (
      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 text-center text-xs text-[var(--text-secondary)]">
        Loading silicon &amp; market telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <TrendingUp className="h-4 w-4" /> AI Silicon &amp; Hyperscaler Equities ({market.tickers.length} Tickers)
          </h2>
          <span className="tabular-mono text-[11px] text-[var(--text-secondary)]">
            Yahoo Finance Live / Cached Snapshot
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {market.tickers.map((t) => {
            const up = t.changePct >= 0;
            const prevPrice = t.price / (1 + t.changePct / 100 || 1);
            const sparkValues = [
              prevPrice * (1 - (t.yoyRevGrowthPct > 0 ? 0.035 : -0.02)),
              prevPrice * (1 - (t.yoyRevGrowthPct > 0 ? 0.02 : -0.01)),
              prevPrice * 0.995,
              prevPrice,
              (prevPrice + t.price) / 2,
              t.price,
            ];
            return (
              <div
                key={t.symbol}
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BrandLogo org={t.name} size={18} className="shrink-0 text-[var(--text-primary)]" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-mono text-sm font-bold text-[var(--text-primary)]">{t.symbol}</span>
                        <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-1 py-0.5 text-[9px] text-[var(--text-muted)] uppercase">
                          {t.sector}
                        </span>
                      </div>
                      <div className="truncate text-[11px] text-[var(--text-secondary)]">{t.name}</div>
                    </div>
                  </div>
                  <span className="tabular-mono shrink-0 text-[9px] text-[var(--text-muted)] uppercase">
                    {t.source}
                  </span>
                </div>

                <div className="tabular-mono mt-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">${t.price.toFixed(2)}</div>
                    <DeltaBadge value={t.changePct} decimals={2} compact />
                  </div>
                  <Sparkline
                    values={sparkValues}
                    tone={up ? 'positive' : 'negative'}
                    width={76}
                    height={24}
                    ariaLabel={`${t.symbol} short-term price trend`}
                  />
                </div>

                <div className="tabular-mono mt-2.5 grid grid-cols-2 gap-1 border-t border-[var(--border-hairline)] pt-2 text-[10px] text-[var(--text-secondary)]">
                  <div>MCap: ${t.marketCapB}B</div>
                  <div>P/E: {t.peRatio ?? 'N/A'}</div>
                  <div>YoY Rev: +{t.yoyRevGrowthPct}%</div>
                  <div>AI Score: {t.aiExposureScore}/100</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
        <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          <Cpu className="h-4 w-4" /> Flagship AI Accelerator Spec &amp; Margin Matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="px-3 py-2.5">Vendor</th>
                <th className="px-3 py-2.5">Accelerator</th>
                <th className="px-3 py-2.5">Node</th>
                <th className="px-3 py-2.5">FP8 TFLOPS</th>
                <th className="px-3 py-2.5">FP4 TFLOPS</th>
                <th className="px-3 py-2.5">HBM</th>
                <th className="px-3 py-2.5">BW (TB/s)</th>
                <th className="px-3 py-2.5">TDP</th>
                <th className="px-3 py-2.5">Gross Margin</th>
                <th className="px-3 py-2.5">Est. Street Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {market.accelerators.map((acc) => (
                <tr key={acc.chip} className="hover:bg-[var(--bg-elevated)]">
                  <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">
                    <span className="inline-flex items-center gap-1.5">
                      <BrandLogo org={acc.vendor} size={14} className="shrink-0" />
                      <span>{acc.vendor}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">{acc.chip}</td>
                  <td className="tabular-mono px-3 py-2.5 text-[var(--text-secondary)]">{acc.processNode}</td>
                  <td className="tabular-mono px-3 py-2.5 text-[var(--text-primary)]">{acc.fp8Tflops.toLocaleString()}</td>
                  <td className="tabular-mono px-3 py-2.5 text-[var(--text-secondary)]">
                    {acc.fp4Tflops ? acc.fp4Tflops.toLocaleString() : '-'}
                  </td>
                  <td className="tabular-mono px-3 py-2.5 text-[var(--text-primary)]">{acc.hbmCapacityGB} GB</td>
                  <td className="tabular-mono px-3 py-2.5 text-[var(--text-primary)]">{acc.hbmBandwidthTBps} TB/s</td>
                  <td className="tabular-mono px-3 py-2.5 text-[var(--text-secondary)]">{acc.tdpWatts}W</td>
                  <td className="tabular-mono px-3 py-2.5 text-[#059669]">~{acc.grossMarginEstPct}%</td>
                  <td className="tabular-mono px-3 py-2.5 text-[var(--text-secondary)]">{acc.estStreetPriceUsd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
        <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          <Building2 className="h-4 w-4" /> Frontier AI Lab IPO &amp; Private Valuation Board
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="px-3 py-2.5">Company</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Valuation</th>
                <th className="px-3 py-2.5">ARR Run-Rate</th>
                <th className="px-3 py-2.5">Val / ARR</th>
                <th className="px-3 py-2.5">IPO Timeline</th>
                <th className="px-3 py-2.5">Key Backers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {market.ipos.map((ipo) => (
                <tr key={ipo.company} className="hover:bg-[var(--bg-elevated)]">
                  <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">
                    <span className="inline-flex items-center gap-1.5">
                      <BrandLogo org={ipo.company} size={14} />
                      <span>{ipo.company}</span>
                    </span>
                  </td>
                  <td className="tabular-mono px-3 py-2.5">
                    <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] uppercase">
                      {ipo.status}
                    </span>
                  </td>
                  <td className="tabular-mono px-3 py-2.5 font-semibold text-[var(--text-primary)]">${ipo.valuationB}B</td>
                  <td className="tabular-mono px-3 py-2.5 text-[#059669]">${ipo.arrRunRateB}B</td>
                  <td className="tabular-mono px-3 py-2.5 text-[var(--text-primary)]">
                    {(ipo.valuationB / ipo.arrRunRateB).toFixed(1)}x
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">{ipo.ipoTimeline}</td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{ipo.keyBackers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceBadge sources={['SEC Filings', 'TrendForce']} onNavigateSources={onNavigateSources} className="mt-3" />
      </section>
    </div>
  );
};
