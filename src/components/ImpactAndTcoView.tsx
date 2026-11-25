import React, { useState } from 'react';
import { Calculator, Cpu, Droplets, HardDrive, Zap } from 'lucide-react';
import { CustomCheckbox, CustomSlider } from './CustomControls.tsx';
import { SourceBadge } from './SourceBadge.tsx';
import type { ImpactDatabase } from '../types.ts';

interface ImpactAndTcoViewProps {
  data: ImpactDatabase | null;
  onNavigateSources?: () => void;
}

export const ImpactAndTcoView: React.FC<ImpactAndTcoViewProps> = ({ data, onNavigateSources }) => {
  // Interactive Local Hardware vs. Cloud API TCO Calculator
  const [monthlyInputM, setMonthlyInputM] = useState(20);
  const [monthlyOutputM, setMonthlyOutputM] = useState(8);
  const [cloudBlendedCost, setCloudBlendedCost] = useState(1.2);
  const [hardwareCapexUsd, setHardwareCapexUsd] = useState(3200);
  const [rigWatts, setRigWatts] = useState(450);
  const [hoursActivePerDay, setHoursActivePerDay] = useState(6);
  const [electricityRate, setElectricityRate] = useState(0.16);
  const [strictPrivacy, setStrictPrivacy] = useState(false);

  if (!data) {
    return (
      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 text-center text-xs text-[var(--text-secondary)]">
        Loading real-world hardware &amp; environmental telemetry...
      </div>
    );
  }

  const { supplyChain, powerAndWater } = data;

  // Component Inflation SVG geometry
  const infW = 640;
  const infH = 230;
  const infPad = { top: 20, right: 20, bottom: 32, left: 44 };
  const infPlotW = infW - infPad.left - infPad.right;
  const infPlotH = infH - infPad.top - infPad.bottom;
  const maxInf = 350;

  const toInfX = (idx: number) =>
    infPad.left + (idx / Math.max(1, supplyChain.inflationQuarterly.length - 1)) * infPlotW;
  const toInfY = (v: number) => infPad.top + infPlotH - (v / maxInf) * infPlotH;

  const infSeries = [
    { key: 'aiCapexIndex' as const, label: 'AI CapEx', color: '#D97706' },
    { key: 'nandSsdIndex' as const, label: 'NAND SSD', color: '#7C3AED' },
    { key: 'ddr5DramIndex' as const, label: 'DDR5 DRAM', color: '#0891B2' },
    { key: 'gpuSpotIndex' as const, label: 'GPU Spot', color: '#059669' },
  ];

  // TCO Calculations
  const monthlyCloudCost = ((monthlyInputM * 3 + monthlyOutputM) / 4) * cloudBlendedCost;
  const monthlyKwh = (rigWatts / 1000) * hoursActivePerDay * 30;
  const monthlyElectricityCost = monthlyKwh * electricityRate;
  const monthlyNetSavings = monthlyCloudCost - monthlyElectricityCost;
  const breakevenMonths =
    monthlyNetSavings > 0 ? Math.ceil(hardwareCapexUsd / monthlyNetSavings) : null;
  const tco24Cloud = monthlyCloudCost * 24;
  const tco24Local = hardwareCapexUsd + monthlyElectricityCost * 24;

  let recommendation = '';
  if (strictPrivacy) {
    recommendation =
      'Self-hosting open-weight models (Qwen4, DeepSeek V4.1, Llama 4, Gemma 4) is required to satisfy strict air-gapped / zero-retention privacy.';
  } else if (breakevenMonths !== null && breakevenMonths <= 18) {
    recommendation = `Self-hosting breaks even in ${breakevenMonths} months. At this token volume, local open-weight inference outperforms cloud API pricing over 24 months.`;
  } else if (breakevenMonths !== null && breakevenMonths <= 36) {
    recommendation = `Marginal payback (${breakevenMonths} months). Due to 2026 DRAM/GPU spot inflation, renting cloud APIs remains more capital-efficient unless utilization increases.`;
  } else {
    recommendation =
      'Cloud API is strictly cheaper. Monthly API spend is lower than local electricity + amortized 2026 hardware CapEx.';
  }

  return (
    <div className="space-y-6">
      {/* 1. Memory, Storage & GPU Supply-Chain Squeeze */}
      <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <HardDrive className="h-4 w-4" /> Memory, Storage &amp; Silicon Supply-Chain Squeeze
          </h2>
          <span className="tabular-mono text-[11px] text-[var(--text-secondary)]">
            Fab LTAs: {supplyChain.ltaBookedThrough}
          </span>
        </div>

        <div className="tabular-mono mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">AI Share of High-End DRAM</div>
            <div className="mt-1 text-xl font-bold text-[var(--text-primary)]">{supplyChain.dramWaferSharePct}%</div>
            <div className="text-[11px] text-[var(--text-secondary)]">HBM/server wafer allocation</div>
          </div>
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">DRAM / SSD YoY Spike</div>
            <div className="mt-1 text-xl font-bold text-[#DC2626]">+{supplyChain.dramSsdYoySpikePct}%</div>
            <div className="text-[11px] text-[var(--text-secondary)]">2025–2026 spot inflation</div>
          </div>
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">PC / Server BOM Inflation</div>
            <div className="mt-1 text-xl font-bold text-[#D97706]">+{supplyChain.pcBomInflationPct}%</div>
            <div className="text-[11px] text-[var(--text-secondary)]">Downstream hardware cost</div>
          </div>
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Fab Capacity Lock-Up</div>
            <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">{supplyChain.ltaBookedThrough}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">HBM3e / HBM4 long-term contracts</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Component Inflation Chart */}
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Component Price Index vs. AI CapEx (2024 Q1 = 100)
              </span>
              <div className="tabular-mono flex flex-wrap gap-3 text-[10px] text-[var(--text-secondary)]">
                {infSeries.map((s) => (
                  <span key={s.key} className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <svg viewBox={`0 0 ${infW} ${infH}`} className="h-52 w-full">
              {[100, 175, 250, 325].map((tick) => {
                const y = toInfY(tick);
                return (
                  <g key={tick}>
                    <line x1={infPad.left} y1={y} x2={infW - infPad.right} y2={y} stroke="var(--border-hairline)" strokeDasharray="3 4" />
                    <text x={infPad.left - 6} y={y + 3} textAnchor="end" className="tabular-mono fill-[var(--text-muted)] text-[10px]">{tick}</text>
                  </g>
                );
              })}
              {supplyChain.inflationQuarterly.map((q, idx) => (
                <text key={q.quarter} x={toInfX(idx)} y={infH - 10} textAnchor="middle" className="tabular-mono fill-[var(--text-secondary)] text-[10px]">
                  {q.quarter}
                </text>
              ))}
              {infSeries.map((s) => {
                const pts = supplyChain.inflationQuarterly.map((q, idx) => `${idx === 0 ? 'M' : 'L'} ${toInfX(idx).toFixed(1)} ${toInfY(q[s.key]).toFixed(1)}`).join(' ');
                return (
                  <g key={s.key}>
                    <path d={pts} fill="none" stroke={s.color} strokeWidth={2} />
                    {supplyChain.inflationQuarterly.map((q, idx) => (
                      <circle key={idx} cx={toInfX(idx)} cy={toInfY(q[s.key])} r={3} fill={s.color} />
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* GPU & Accelerator Pricing Table */}
          <div className="overflow-x-auto rounded border border-[var(--border-hairline)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                  <th className="px-3 py-2">GPU / Accelerator</th>
                  <th className="px-3 py-2">VRAM</th>
                  <th className="px-3 py-2">MSRP</th>
                  <th className="px-3 py-2">Spot</th>
                  <th className="px-3 py-2">Cloud/hr</th>
                  <th className="px-3 py-2">Lead Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {supplyChain.gpuPricing.map((g) => {
                  const markup = ((g.spotStreetUsd - g.msrpUsd) / g.msrpUsd) * 100;
                  return (
                    <tr key={g.model} className="hover:bg-[var(--bg-elevated)]">
                      <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{g.model}</td>
                      <td className="tabular-mono px-3 py-2 text-[var(--text-secondary)]">{g.vramGB} GB</td>
                      <td className="tabular-mono px-3 py-2 text-[var(--text-secondary)]">${g.msrpUsd.toLocaleString()}</td>
                      <td className="tabular-mono px-3 py-2 font-semibold text-[var(--text-primary)]">
                        ${g.spotStreetUsd.toLocaleString()}
                        <span className={`ml-1 text-[10px] ${markup > 5 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                          ({markup >= 0 ? '+' : ''}{Math.round(markup)}%)
                        </span>
                      </td>
                      <td className="tabular-mono px-3 py-2 text-[var(--text-secondary)]">{g.cloudHourlyUsd ? `$${g.cloudHourlyUsd.toFixed(2)}` : '—'}</td>
                      <td className="tabular-mono px-3 py-2 text-[var(--text-muted)]">{g.leadTimeWeeks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 2. Data Center Power, Grid & Water Telemetry */}
      <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <Zap className="h-4 w-4" /> Data Center Power, Grid &amp; Water Externalities
          </h2>
          <span className="tabular-mono text-[11px] text-[var(--text-secondary)]">
            US AI Hubs: {powerAndWater.usAiHubsTwhRange}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Power & Water Breakdown */}
          <div className="space-y-3 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3.5 text-xs">
            <div>
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Global Data Center Electricity</div>
              <div className="tabular-mono mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-[var(--text-primary)]">{powerAndWater.globalPowerTwh2026} TWh/yr</span>
                <span className="text-[11px] text-[var(--text-secondary)]">→ {powerAndWater.globalPowerTwh2030Est} TWh (2030 est.)</span>
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] pt-2.5">
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                <Droplets className="h-3 w-3" /> Direct vs. Indirect Water Breakdown
              </div>
              <div className="tabular-mono mt-1.5 space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Direct Cooling (Evap Tower):</span><span className="font-semibold">{powerAndWater.directCoolingLitersPerKwhEvap} L/kWh</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Direct Cooling (Closed-Loop):</span><span className="font-semibold text-[#059669]">{powerAndWater.directCoolingLitersPerKwhClosed} L/kWh</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Indirect Power-Plant Water:</span><span className="font-semibold">{powerAndWater.indirectWaterLitersPerKwh} L/kWh avg</span></div>
              </div>
            </div>
          </div>

          {/* Relatable Scale Comparisons */}
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3.5 text-xs">
            <div className="mb-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
              Empirical Scale Comparison (No Sensationalism)
            </div>
            <div className="divide-y divide-[var(--border-hairline)]">
              {powerAndWater.relatableComparisons.map((c) => (
                <div key={c.label} className="flex items-center justify-between py-2">
                  <span className="text-[var(--text-secondary)]">{c.label}</span>
                  <span className="tabular-mono shrink-0 font-semibold text-[var(--text-primary)]">
                    {c.waterGal} • {c.energyKwh}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Jevons Paradox Efficiency Curve */}
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5">
            <div className="mb-1 text-xs font-semibold text-[var(--text-primary)]">
              Jevons Paradox: Prompt Efficiency vs. Total Compute
            </div>
            <p className="mb-2 text-[11px] text-[var(--text-secondary)]">
              ~33x drop in Wh/prompt alongside 16.2x surge in reasoning compute volume.
            </p>
            <div className="tabular-mono space-y-2 text-[11px]">
              {powerAndWater.efficiencyCurve.map((pt) => (
                <div key={pt.year} className="grid grid-cols-12 items-center gap-2">
                  <span className="col-span-2 font-semibold text-[var(--text-primary)]">{pt.year}</span>
                  <div className="col-span-5">
                    <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                      <span>Wh/prompt</span>
                      <span>{pt.whPerMedianPrompt}</span>
                    </div>
                    <div className="h-1.5 rounded-sm bg-[var(--bg-elevated)]">
                      <div className="h-full bg-[#059669]" style={{ width: `${Math.min(100, (pt.whPerMedianPrompt / 4.6) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="col-span-5">
                    <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                      <span>Volume idx</span>
                      <span>{pt.reasoningComputeVolumeIndex}</span>
                    </div>
                    <div className="h-1.5 rounded-sm bg-[var(--bg-elevated)]">
                      <div className="h-full bg-[#D97706]" style={{ width: `${Math.min(100, (pt.reasoningComputeVolumeIndex / 1620) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Local Hardware vs. Cloud API Decision Calculator */}
      <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <Calculator className="h-4 w-4" /> Local Hardware vs. Cloud API Decision Calculator (TCO)
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">
            Factors 2026 DRAM/GPU spot inflation &amp; local electricity rates
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="tabular-mono space-y-3 text-xs lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5">
                <span className="block text-[10px] text-[var(--text-muted)] uppercase">Monthly Input (M tok)</span>
                <input type="number" min={1} value={monthlyInputM} onChange={(e) => setMonthlyInputM(Math.max(0, Number(e.target.value)))} className="mt-1 w-full bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none" />
              </label>
              <label className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5">
                <span className="block text-[10px] text-[var(--text-muted)] uppercase">Monthly Output (M tok)</span>
                <input type="number" min={1} value={monthlyOutputM} onChange={(e) => setMonthlyOutputM(Math.max(0, Number(e.target.value)))} className="mt-1 w-full bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none" />
              </label>
              <label className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5">
                <span className="block text-[10px] text-[var(--text-muted)] uppercase">Cloud API Blended ($/1M)</span>
                <input type="number" step="0.05" min={0.05} value={cloudBlendedCost} onChange={(e) => setCloudBlendedCost(Math.max(0.01, Number(e.target.value)))} className="mt-1 w-full bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none" />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5">
                <span className="block text-[10px] text-[var(--text-muted)] uppercase">Local Rig Budget ($)</span>
                <input type="number" step={100} min={400} value={hardwareCapexUsd} onChange={(e) => setHardwareCapexUsd(Math.max(0, Number(e.target.value)))} className="mt-1 w-full bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none" />
              </label>
              <label className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5">
                <span className="block text-[10px] text-[var(--text-muted)] uppercase">Rig Power Draw (Watts)</span>
                <input type="number" step={25} min={50} value={rigWatts} onChange={(e) => setRigWatts(Math.max(10, Number(e.target.value)))} className="mt-1 w-full bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none" />
              </label>
              <label className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5">
                <span className="block text-[10px] text-[var(--text-muted)] uppercase">Electricity ($/kWh)</span>
                <input type="number" step="0.01" min={0.02} value={electricityRate} onChange={(e) => setElectricityRate(Math.max(0.01, Number(e.target.value)))} className="mt-1 w-full bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none" />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3">
              <div className="flex flex-1 items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="shrink-0">Active Hours / Day:</span>
                <CustomSlider min={1} max={24} step={1} value={hoursActivePerDay} onChange={setHoursActivePerDay} accentColor="#0891B2" className="max-w-[180px]" />
                <strong className="shrink-0 text-[var(--text-primary)]">{hoursActivePerDay}h/day</strong>
              </div>
              <CustomCheckbox
                checked={strictPrivacy}
                onChange={setStrictPrivacy}
                label="Require Air-Gapped / Local Privacy"
              />
            </div>
          </div>

          {/* TCO Output Card */}
          <div className="flex flex-col justify-between rounded border border-[var(--border-strong)] bg-[var(--bg-sub)] p-4">
            <div className="tabular-mono space-y-2 text-xs">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                <Cpu className="h-3.5 w-3.5" /> 24-Month TCO Comparison
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Monthly Cloud API:</span>
                <span className="font-bold text-[var(--text-primary)]">${monthlyCloudCost.toFixed(2)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Monthly Local Power:</span>
                <span className="font-bold text-[var(--text-primary)]">${monthlyElectricityCost.toFixed(2)}/mo</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-hairline)] pt-2">
                <span className="text-[var(--text-secondary)]">24-Mo Cloud Total:</span>
                <span className="font-bold text-[var(--text-primary)]">${tco24Cloud.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">24-Mo Local Total:</span>
                <span className="font-bold text-[var(--text-primary)]">${tco24Local.toFixed(0)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-hairline)] pt-2">
                <span className="text-[var(--text-secondary)]">Hardware Break-Even:</span>
                <span className="font-bold text-[#059669]">
                  {breakevenMonths !== null ? `${breakevenMonths} months` : 'Never (> API)'}
                </span>
              </div>
            </div>

            <p className="mt-3 border-t border-[var(--border-hairline)] pt-2.5 text-xs text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">Assessment:</strong> {recommendation}
            </p>
          </div>
        </div>
        <SourceBadge sources={['TrendForce', 'IEA / LBNL', 'OpenRouter']} onNavigateSources={onNavigateSources} className="mt-4" />
      </section>
    </div>
  );
};
