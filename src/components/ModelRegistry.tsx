import React, { useMemo, useState } from 'react';
import { ArrowDownUp, Eye, GitBranch, Layers, Lock, Unlock, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { CustomCheckbox } from './CustomControls.tsx';
import { SourceBadge } from './SourceBadge.tsx';
import type { ModelNode, PlotYVar } from '../types.ts';

interface ModelRegistryProps {
  models: ModelNode[];
  activeBenchmarkKey: PlotYVar;
  onInspectModel: (id: string) => void;
  onNavigateSources?: () => void;
}

type SortField =
  | 'name'
  | 'family'
  | 'releaseDate'
  | 'contextWindow'
  | 'outputCostPer1M'
  | 'paramsTotalB'
  | 'score';

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return `${tokens}`;
}

export const ModelRegistry: React.FC<ModelRegistryProps> = ({
  models,
  activeBenchmarkKey,
  onInspectModel,
  onNavigateSources,
}) => {
  const [sortField, setSortField] = useState<SortField>('releaseDate');
  const [sortAsc, setSortAsc] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [benchmarkedOnly, setBenchmarkedOnly] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((v) => !v);
    else {
      setSortField(field);
      setSortAsc(field === 'name' || field === 'family' || field === 'outputCostPer1M');
    }
  };

  const sortedModels = useMemo(() => {
    const base = benchmarkedOnly
      ? models.filter((m) => m.benchmarks[activeBenchmarkKey] !== null)
      : models;
    return [...base].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'family':
          cmp = a.family.localeCompare(b.family);
          break;
        case 'releaseDate':
          cmp = a.releaseDate.localeCompare(b.releaseDate);
          break;
        case 'contextWindow':
          cmp = a.contextWindow - b.contextWindow;
          break;
        case 'outputCostPer1M':
          cmp = a.outputCost1M - b.outputCost1M;
          break;
        case 'paramsTotalB':
          cmp = a.architecture.totalParamsB - b.architecture.totalParamsB;
          break;
        case 'score':
          cmp = (a.benchmarks[activeBenchmarkKey] ?? -1) - (b.benchmarks[activeBenchmarkKey] ?? -1);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [models, benchmarkedOnly, sortField, sortAsc, activeBenchmarkKey]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const comparedModels = useMemo(
    () => compareIds.map((id) => models.find((m) => m.id === id)).filter(Boolean) as ModelNode[],
    [compareIds, models],
  );

  return (
    <div className="space-y-4">
      {comparedModels.length > 0 && (
        <section className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase">
              <Layers className="h-3.5 w-3.5" /> Side-by-Side Comparison ({comparedModels.length}/4)
            </span>
            <button onClick={() => setCompareIds([])} className="flex items-center gap-1 rounded border border-[var(--border-hairline)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {comparedModels.map((m) => (
              <div key={m.id} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <BrandLogo org={m.family} size={14} className="shrink-0 text-[var(--text-secondary)]" />
                    <span className="truncate font-semibold text-[var(--text-primary)]">{m.name}</span>
                  </div>
                  <button onClick={() => onInspectModel(m.id)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{m.family}</div>
                <div className="tabular-mono mt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Params:</span><span>{m.architecture.totalParamsStr}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Context:</span><span>{formatContext(m.contextWindow)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">In/Out:</span><span>${m.inputCost1M.toFixed(2)} / ${m.outputCost1M.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">LiveBench:</span><span>{m.benchmarks.livebenchGlobal ?? 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">SWE-bench:</span><span>{m.benchmarks.sweBenchVerified ?? 'N/A'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] px-4 py-3">
          <div>
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
              <GitBranch className="h-4 w-4" /> Exhaustive Model Registry ({sortedModels.length} Models)
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Click any row to open the Deep Spec Inspector, or select up to 4 models for side-by-side comparison.
            </p>
          </div>
          <div className="tabular-mono flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setBenchmarkedOnly(false)}
              className={`rounded border px-2.5 py-1 transition-colors ${
                !benchmarkedOnly
                  ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[var(--text-secondary)]'
              }`}
            >
              All Models ({models.length})
            </button>
            <button
              type="button"
              onClick={() => setBenchmarkedOnly(true)}
              className={`rounded border px-2.5 py-1 transition-colors ${
                benchmarkedOnly
                  ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[var(--text-secondary)]'
              }`}
            >
              Benchmarked Only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="px-3 py-2.5">Cmp</th>
                <th className="cursor-pointer px-3 py-2.5 hover:text-[var(--text-primary)]" onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center gap-1">Model <ArrowDownUp className="h-3 w-3" /></span>
                </th>
                <th className="cursor-pointer px-3 py-2.5 hover:text-[var(--text-primary)]" onClick={() => toggleSort('family')}>Family</th>
                <th className="px-3 py-2.5">Access</th>
                <th className="cursor-pointer px-3 py-2.5 hover:text-[var(--text-primary)]" onClick={() => toggleSort('paramsTotalB')}>Arch / Params</th>
                <th className="cursor-pointer px-3 py-2.5 hover:text-[var(--text-primary)]" onClick={() => toggleSort('contextWindow')}>Ctx</th>
                <th className="cursor-pointer px-3 py-2.5 hover:text-[var(--text-primary)]" onClick={() => toggleSort('outputCostPer1M')}>In / Out ($/1M)</th>
                <th className="cursor-pointer px-3 py-2.5 hover:text-[var(--text-primary)]" onClick={() => toggleSort('score')}>Score</th>
                <th className="cursor-pointer px-3 py-2.5 hover:text-[var(--text-primary)]" onClick={() => toggleSort('releaseDate')}>Released</th>
                <th className="px-3 py-2.5">License</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {sortedModels.map((m) => {
                const isOpen = m.weightClass === 'open-weight';
                const checked = compareIds.includes(m.id);
                const score = m.benchmarks[activeBenchmarkKey];
                return (
                  <tr
                    key={m.id}
                    onClick={() => onInspectModel(m.id)}
                    className="cursor-pointer transition-colors hover:bg-[var(--bg-elevated)]"
                  >
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <CustomCheckbox checked={checked} onChange={() => toggleCompare(m.id)} />
                    </td>
                    <td className="max-w-[230px] truncate px-3 py-2 font-medium text-[var(--text-primary)]">{m.name}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <BrandLogo org={m.family} size={14} className="shrink-0" />
                        <span>{m.family}</span>
                      </span>
                    </td>
                    <td className="tabular-mono px-3 py-2 text-[10px] text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1">
                        {isOpen ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        {isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </td>
                    <td className="tabular-mono px-3 py-2 text-[var(--text-secondary)]">
                      {m.architecture.type} • {m.architecture.totalParamsStr}
                    </td>
                    <td className="tabular-mono px-3 py-2 text-[var(--text-secondary)]">{formatContext(m.contextWindow)}</td>
                    <td className="tabular-mono px-3 py-2 text-[var(--text-secondary)]">
                      ${m.inputCost1M.toFixed(2)} / ${m.outputCost1M.toFixed(2)}
                    </td>
                    <td className="tabular-mono px-3 py-2 font-semibold text-[var(--text-primary)]">
                      {score !== null ? score : '-'}
                    </td>
                    <td className="tabular-mono px-3 py-2 text-[var(--text-secondary)]">{m.releaseDate}</td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-[var(--text-muted)]">{m.license}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border-hairline)] px-4 py-2.5">
          <SourceBadge sources={['OpenRouter', 'HF Open LLM', 'LiveBench 2.0', 'LMArena']} onNavigateSources={onNavigateSources} />
        </div>
      </section>
    </div>
  );
};
