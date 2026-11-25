import React from 'react';
import { Building2, Cpu, DollarSign, GitBranch, Globe, Users } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { SourceBadge } from './SourceBadge.tsx';
import type { LabDossier, ModelNode } from '../types.ts';

interface LabDossiersProps {
  dossiers: LabDossier[];
  models: ModelNode[];
  onInspectModel: (id: string) => void;
  onNavigateSources?: () => void;
}

export const LabDossiers: React.FC<LabDossiersProps> = ({
  dossiers,
  models,
  onInspectModel,
  onNavigateSources,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          <Building2 className="h-4 w-4" /> AI Lab &amp; Silicon Dossiers ({dossiers.length} Entities)
        </h2>
        <span className="text-xs text-[var(--text-secondary)]">
          Leadership, Compute Clusters, Valuations &amp; Model Rosters
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {dossiers.map((d) => {
          const roster = models
            .filter((m) => d.flagshipFamilies.includes(m.family))
            .sort((a, b) => {
              const iqA = a.benchmarks.compositeIQ ?? -1;
              const iqB = b.benchmarks.compositeIQ ?? -1;
              if (iqB !== iqA) return iqB - iqA;
              return b.releaseDate.localeCompare(a.releaseDate);
            })
            .slice(0, 6);

          return (
            <article
              key={d.id}
              className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-mono rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] uppercase">
                      {d.type}
                    </span>
                    <span className="tabular-mono text-[11px] text-[var(--text-secondary)]">{d.ipoStatus}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <BrandLogo org={d.name} size={18} className="text-[var(--text-primary)]" />
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{d.name}</h3>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {d.hq}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {d.leadership}</span>
                  </div>
                </div>

                <div className="tabular-mono text-right">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Valuation / MCap</div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">${d.valuationB}B</div>
                  <div className="text-[11px] text-[#059669]">ARR: ${d.arrRunRateB}B</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5">
                  <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] uppercase"><Cpu className="h-3 w-3" /> Compute Cluster</div>
                  <div className="mt-1 font-medium text-[var(--text-primary)]">{d.computeCluster}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{d.acceleratorMix}</div>
                </div>

                <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5">
                  <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] uppercase"><DollarSign className="h-3 w-3" /> Capital &amp; Focus</div>
                  <div className="tabular-mono mt-1 font-medium text-[var(--text-primary)]">
                    {d.totalFundingB > 0 ? `$${d.totalFundingB}B Raised` : 'Public / Self-Funded'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {d.focusAreas.map((f) => (
                      <span key={f} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] uppercase">
                  <GitBranch className="h-3 w-3" /> Model Roster ({roster.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {roster.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onInspectModel(m.id)}
                      className="tabular-mono rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <SourceBadge sources={['SEC Filings', 'Epoch AI', 'OpenRouter']} onNavigateSources={onNavigateSources} />
    </section>
  );
};
