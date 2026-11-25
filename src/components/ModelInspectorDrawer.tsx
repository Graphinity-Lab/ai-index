import React, { useMemo, useState } from 'react';
import { BarChart3, Calculator, GitBranch, HardDrive, Lock, Unlock, X, Zap } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { CustomSlider } from './CustomControls.tsx';
import type { ModelNode, PlotYVar } from '../types.ts';

interface ModelInspectorDrawerProps {
  model: ModelNode | null;
  allModels: ModelNode[];
  onClose: () => void;
  onSelectModel: (id: string) => void;
}

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return `${tokens}`;
}

function gpuFitBadge(vramGB: number): { label: string; cls: string } {
  if (vramGB <= 8) return { label: '8GB Consumer GPU', cls: 'text-[#059669]' };
  if (vramGB <= 16) return { label: '16GB Consumer GPU', cls: 'text-[#059669]' };
  if (vramGB <= 24) return { label: '24GB RTX 4090/5090', cls: 'text-[#0891B2]' };
  if (vramGB <= 80) return { label: '1x 80GB H100/A100', cls: 'text-[#D97706]' };
  return { label: `${Math.ceil(vramGB / 80)}x 80GB Server`, cls: 'text-[#DC2626]' };
}

const RADAR_METRICS: Array<{ key: PlotYVar; label: string; max: number }> = [
  { key: 'compositeIQ', label: 'Composite IQ', max: 100 },
  { key: 'livebenchGlobal', label: 'LiveBench 2.0', max: 100 },
  { key: 'sweBenchVerified', label: 'SWE-bench', max: 100 },
  { key: 'mmluPro', label: 'MMLU-Pro', max: 100 },
  { key: 'gpqaDiamond', label: 'GPQA', max: 100 },
  { key: 'aimeFrontierMath', label: 'AIME/Math', max: 60 },
];

export const ModelInspectorDrawer: React.FC<ModelInspectorDrawerProps> = ({
  model,
  allModels,
  onClose,
  onSelectModel,
}) => {
  const [dailyInputM, setDailyInputM] = useState(2.0);
  const [dailyOutputM, setDailyOutputM] = useState(0.5);
  const [cacheHitPct, setCacheHitPct] = useState(40);

  const byId = useMemo(() => {
    const map = new Map<string, ModelNode>();
    for (const m of allModels) map.set(m.id, m);
    return map;
  }, [allModels]);

  const lineageTree = useMemo(() => {
    if (!model) return { ancestors: [] as ModelNode[], descendants: [] as ModelNode[] };
    const ancestors: ModelNode[] = [];
    let cur = model.parentId ? byId.get(model.parentId) : undefined;
    while (cur) {
      ancestors.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    const descendants = allModels.filter((m) => m.parentId === model.id);
    return { ancestors, descendants };
  }, [model, byId, allModels]);

  if (!model) return null;

  const isOpen = model.weightClass === 'open-weight';
  const uncachedRatio = 1 - cacheHitPct / 100;
  const cachedRatio = cacheHitPct / 100;
  const dailyCost =
    dailyInputM * (uncachedRatio * model.inputCost1M + cachedRatio * model.cachedInputCost1M) +
    dailyOutputM * model.outputCost1M;
  const monthlyCost = dailyCost * 30;
  const estRespSec =
    model.tokensPerSec && model.ttftMs
      ? (model.ttftMs / 1000 + 1000 / model.tokensPerSec).toFixed(1)
      : null;

  const cx = 110;
  const cy = 105;
  const radius = 72;
  const angleStep = (Math.PI * 2) / RADAR_METRICS.length;

  const radarPoints = RADAR_METRICS.map((m, idx) => {
    const raw = model.benchmarks[m.key];
    const ratio = raw !== null ? Math.min(1, Math.max(0.05, raw / m.max)) : 0.05;
    const angle = idx * angleStep - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius * ratio,
      y: cy + Math.sin(angle) * radius * ratio,
      lx: cx + Math.cos(angle) * (radius + 18),
      ly: cy + Math.sin(angle) * (radius + 18),
      label: m.label,
    };
  });

  const radarPath =
    radarPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="h-full w-full max-w-xl overflow-y-auto border-l border-[var(--border-strong)] bg-[var(--bg-canvas)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
          <div>
            <div className="tabular-mono flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)]">
              <BrandLogo org={model.family} size={16} className="text-[var(--text-primary)]" />
              <span>{model.family}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                {isOpen ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {isOpen ? 'Open-Weight' : 'Proprietary'}
              </span>
              <span>•</span>
              <span>GEN-{model.generation}</span>
            </div>
            <h2 className="mt-1.5 text-xl font-semibold text-[var(--text-primary)]">{model.name}</h2>
            <p className="tabular-mono mt-0.5 text-[11px] text-[var(--text-muted)]">
              Released {model.releaseDate} • Cutoff {model.knowledgeCutoff} • {model.license}
            </p>
          </div>
          <button onClick={onClose} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-3">
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5">
            <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Architecture</div>
            <div className="tabular-mono mt-1 font-bold text-[var(--text-primary)]">{model.architecture.type}</div>
            <div className="tabular-mono text-[11px] text-[var(--text-secondary)]">{model.architecture.totalParamsStr} / {model.architecture.activeParamsStr}</div>
          </div>
          <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5">
            <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Context / Out</div>
            <div className="tabular-mono mt-1 font-bold text-[var(--text-primary)]">{formatContext(model.contextWindow)}</div>
            <div className="tabular-mono text-[11px] text-[var(--text-secondary)]">Max out: {formatContext(model.maxOutputTokens)}</div>
          </div>
          <div className="col-span-2 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5 sm:col-span-1">
            <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] uppercase"><Zap className="h-3 w-3" /> Speed / TTFT</div>
            <div className="tabular-mono mt-1 font-bold text-[var(--text-primary)]">{model.tokensPerSec ? `${model.tokensPerSec} tok/s` : 'N/A'}</div>
            <div className="tabular-mono text-[11px] text-[var(--text-secondary)]">TTFT: {model.ttftMs ? `${model.ttftMs} ms` : 'N/A'}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5 sm:grid-cols-2">
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 220 210" className="h-48 w-48">
              {[0.33, 0.66, 1].map((scale) => (
                <polygon
                  key={scale}
                  points={RADAR_METRICS.map((_, idx) => {
                    const a = idx * angleStep - Math.PI / 2;
                    return `${(cx + Math.cos(a) * radius * scale).toFixed(1)},${(cy + Math.sin(a) * radius * scale).toFixed(1)}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--border-hairline)"
                />
              ))}
              {radarPoints.map((p, idx) => (
                <text key={idx} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" className="tabular-mono fill-[var(--text-secondary)] text-[8.5px]">
                  {p.label}
                </text>
              ))}
              <path d={radarPath} fill={isOpen ? 'rgba(8, 145, 178, 0.18)' : 'rgba(217, 119, 6, 0.18)'} stroke={isOpen ? '#0891B2' : '#D97706'} strokeWidth={1.8} />
            </svg>
          </div>
          <div className="tabular-mono space-y-1 text-[11px]">
            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase"><BarChart3 className="h-3 w-3" /> Benchmark Suite</div>
            {(
              [
                ['Composite IQ', model.benchmarks.compositeIQ, ''],
                ['LiveBench 2.0', model.benchmarks.livebenchGlobal, '%'],
                ['LB Agentic', model.benchmarks.livebenchAgentic, '%'],
                ['SWE-bench', model.benchmarks.sweBenchVerified, '%'],
                ['GPQA Diamond', model.benchmarks.gpqaDiamond, '%'],
                ['AIME / Math', model.benchmarks.aimeFrontierMath, '%'],
                ["Humanity's Last Exam", model.benchmarks.humanitysLastExam, '%'],
                ['LMArena Text', model.benchmarks.lmArenaTextElo, ' Elo'],
                ['IQ / Dollar', model.benchmarks.intelPerDollar, ' idx'],
              ] as const
            ).map(([label, val, unit]) => (
              <div key={label} className="flex justify-between border-b border-[var(--border-hairline)] py-0.5">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="font-semibold text-[var(--text-primary)]">{val !== null ? `${val}${unit}` : 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase">
              <HardDrive className="h-3.5 w-3.5 text-[var(--text-secondary)]" /> Local Hardware VRAM Calculator
            </span>
            <span className="tabular-mono text-[10px] text-[var(--text-muted)]">{model.architecture.totalParamsStr}</span>
          </div>
          <div className="tabular-mono mt-2 flex flex-wrap gap-1.5">
            {model.quantizationFormats.map((q) => (
              <span key={q} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{q}</span>
            ))}
          </div>
          {isOpen ? (
            <div className="tabular-mono mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              {(
                [
                  ['FP16', model.vramFootprintGB.fp16],
                  ['FP8 / Q8', model.vramFootprintGB.fp8],
                  ['INT4 / Q4', model.vramFootprintGB.int4],
                  ['1.58-bit', model.vramFootprintGB.ternary],
                ] as const
              ).map(([fmt, gb]) => {
                const fit = gpuFitBadge(gb);
                return (
                  <div key={fmt} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2 text-center">
                    <div className="text-[10px] text-[var(--text-muted)]">{fmt}</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{gb} GB</div>
                    <div className={`mt-0.5 text-[9px] ${fit.cls}`}>{fit.label}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)]"><Lock className="h-3 w-3" /> Proprietary weights — hosted API inference only.</p>
          )}
        </div>

        <div className="mt-4 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase">
              <Calculator className="h-3.5 w-3.5 text-[var(--text-secondary)]" /> API Cost &amp; Latency Simulator
            </span>
            <span className="tabular-mono text-[10px] text-[var(--text-secondary)]">
              ${model.inputCost1M.toFixed(2)} in / ${model.outputCost1M.toFixed(2)} out
            </span>
          </div>

          <div className="tabular-mono mt-3 space-y-2.5 text-xs">
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-[var(--text-secondary)]">
                <span>Daily Input Tokens</span>
                <span className="text-[var(--text-primary)]">{dailyInputM.toFixed(1)}M / day</span>
              </div>
              <CustomSlider min={0.1} max={50} step={0.5} value={dailyInputM} onChange={setDailyInputM} accentColor="#0891B2" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-[var(--text-secondary)]">
                <span>Daily Output Tokens</span>
                <span className="text-[var(--text-primary)]">{dailyOutputM.toFixed(1)}M / day</span>
              </div>
              <CustomSlider min={0.1} max={20} step={0.1} value={dailyOutputM} onChange={setDailyOutputM} accentColor="#D97706" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-[var(--text-secondary)]">
                <span>Prompt Cache Hit Rate</span>
                <span className="text-[#059669]">{cacheHitPct}%</span>
              </div>
              <CustomSlider min={0} max={90} step={5} value={cacheHitPct} onChange={setCacheHitPct} accentColor="#059669" />
            </div>
          </div>

          <div className="tabular-mono mt-3 grid grid-cols-2 gap-2 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5 text-[11px]">
            <div>
              <div className="text-[10px] text-[var(--text-muted)]">Monthly API Spend</div>
              <div className="text-base font-bold text-[var(--text-primary)]">${monthlyCost.toFixed(2)} / mo</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[var(--text-muted)]">1k-Tok Response Time</div>
              <div className="text-base font-bold text-[var(--text-primary)]">{estRespSec ? `${estRespSec}s` : 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase"><GitBranch className="h-3.5 w-3.5" /> Ancestry &amp; Descendant Chain</div>
          <div className="tabular-mono mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            {lineageTree.ancestors.map((anc) => (
              <React.Fragment key={anc.id}>
                <button onClick={() => onSelectModel(anc.id)} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{anc.name}</button>
                <span className="text-[var(--text-muted)]">→</span>
              </React.Fragment>
            ))}
            <span className="rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2 py-0.5 font-semibold text-[var(--text-primary)]">{model.name}</span>
            {lineageTree.descendants.map((desc) => (
              <React.Fragment key={desc.id}>
                <span className="text-[var(--text-muted)]">→</span>
                <button onClick={() => onSelectModel(desc.id)} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{desc.name}</button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
