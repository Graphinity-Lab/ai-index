import React, { useState } from 'react';
import { Check, ExternalLink, FileText, Scale, ShieldCheck, Trash2 } from 'lucide-react';

interface SourcesAndLegalViewProps {
  onClearLocalData: () => void;
}

const DATA_PROVIDERS = [
  {
    name: 'OpenRouter API',
    tag: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/models',
    cadence: 'Live / 6h Cron',
    scope: 'Model catalog, context windows, max output tokens, prompt/completion pricing',
    terms: 'Public API metadata; model weights governed by respective provider licenses.',
  },
  {
    name: 'LiveBench',
    tag: 'LiveBench 2.0',
    url: 'https://livebench.ai',
    cadence: 'Monthly / HF Dataset Sync',
    scope: 'Contamination-free Global, Reasoning, Coding, Agentic, Browser Use scores',
    terms: 'Apache 2.0 / Research attribution.',
  },
  {
    name: 'Hugging Face Open LLM Leaderboard',
    tag: 'HF Open LLM',
    url: 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard',
    cadence: 'Live / 6h Cron',
    scope: 'Open-weight MMLU-Pro and GPQA Diamond evaluations',
    terms: 'Open-source evaluation harness & dataset.',
  },
  {
    name: 'LMSYS / LMArena',
    tag: 'LMArena',
    url: 'https://lmarena.ai',
    cadence: 'Periodic / HF Dataset Sync',
    scope: 'Crowdsourced blind Text Elo and WebDev Elo ratings',
    terms: 'CC-BY-4.0 / Research citation.',
  },
  {
    name: 'Artificial Analysis',
    tag: 'Artificial Analysis',
    url: 'https://artificialanalysis.ai',
    cadence: 'Periodic Reference',
    scope: 'Median throughput (tok/s), TTFT latency (ms), and cost-per-task baselines',
    terms: 'Independent benchmark telemetry attribution.',
  },
  {
    name: 'Epoch AI',
    tag: 'Epoch AI',
    url: 'https://epoch.ai',
    cadence: 'Periodic Reference',
    scope: 'Training compute (FLOPs), training cost estimates, and scaling-law curves',
    terms: 'CC-BY-4.0 Epoch AI Notable Models dataset.',
  },
  {
    name: 'IEA & Lawrence Berkeley National Lab (LBNL)',
    tag: 'IEA / LBNL',
    url: 'https://eta.lbl.gov',
    cadence: 'Annual / Report Updates',
    scope: 'Global & US data center electricity (TWh), direct vs. indirect water (L/kWh)',
    terms: 'Public research & government laboratory reports.',
  },
  {
    name: 'TrendForce',
    tag: 'TrendForce',
    url: 'https://www.trendforce.com',
    cadence: 'Quarterly Market Index',
    scope: 'DRAM/HBM wafer allocation, NAND SSD, and PC/server BOM inflation indices',
    terms: 'Market research summaries.',
  },
  {
    name: 'Yahoo Finance & Public SEC Filings',
    tag: 'SEC Filings',
    url: 'https://www.sec.gov/edgar',
    cadence: 'Live Quotes / Quarterly 10-Q/10-K',
    scope: 'Public equity quotes, hyperscaler CapEx, gross margins, and ARR disclosures',
    terms: 'Public market disclosures & delayed quote feeds.',
  },
];

export const SourcesAndLegalView: React.FC<SourcesAndLegalViewProps> = ({
  onClearLocalData,
}) => {
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    onClearLocalData();
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Data Providers & Attribution */}
      <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <FileText className="h-4 w-4" /> Upstream Data Providers &amp; Attribution
          </h2>
          <span className="tabular-mono text-[11px] text-[var(--text-secondary)]">
            OPEN SOURCE // MIT LICENSE
          </span>
        </div>

        <p className="mb-4 text-xs text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Zero Ownership Claim:</strong> Graphinity Lab does not claim ownership of third-party benchmarks, model weights, company trademarks, or upstream research datasets. This project acts strictly as a transparent, open-source (MIT) aggregation and visualization layer that credits and links directly to every original source.
        </p>

        <div className="overflow-x-auto rounded border border-[var(--border-hairline)]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="px-3 py-2.5">Source / Consortium</th>
                <th className="px-3 py-2.5">Inline Tag</th>
                <th className="px-3 py-2.5">Refresh Cadence</th>
                <th className="px-3 py-2.5">Telemetry Scope</th>
                <th className="px-3 py-2.5">License / Terms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {DATA_PROVIDERS.map((p) => (
                <tr key={p.name} className="hover:bg-[var(--bg-elevated)]">
                  <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <span>{p.name}</span>
                      <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                    </a>
                  </td>
                  <td className="tabular-mono px-3 py-2.5">
                    <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
                      SRC: {p.tag}
                    </span>
                  </td>
                  <td className="tabular-mono px-3 py-2.5 text-[var(--text-secondary)]">{p.cadence}</td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">{p.scope}</td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{p.terms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Canadian Privacy (PIPEDA / CPPA / Law 25) & Accessibility (AODA / WCAG 2.1 AA) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
              <ShieldCheck className="h-4 w-4" /> Canadian Privacy &amp; Data Transparency (PIPEDA / CPPA / Law 25)
            </h2>
          </div>

          <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
            <p>
              <strong className="text-[var(--text-primary)]">Cookie-Free by Default:</strong>{' '}
              Graphinity Lab // AI Index does not use third-party advertising trackers, behavioral profiling, or cross-site tracking cookies.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Local Storage Only:</strong>{' '}
              Your theme preference (<code className="tabular-mono">ai-terminal-theme</code>) and custom planted models (<code className="tabular-mono">ai-lineage-custom-models-v2</code>) are stored strictly in your browser&apos;s <code className="tabular-mono">localStorage</code> and are never sold or transmitted to third-party brokers.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Server Security Logs:</strong>{' '}
              Standard transient HTTP access/rate-limit logs may be retained briefly on the host infrastructure solely for DDoS mitigation and operational reliability.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Privacy Officer Contact:</strong>{' '}
              Graphinity Lab, Ontario, Canada ·{' '}
              <a href="mailto:privacy@graphinitylab.com" className="underline text-[var(--text-primary)]">
                privacy@graphinitylab.com
              </a>
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-[var(--border-hairline)] pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="tabular-mono inline-flex items-center gap-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-primary)] hover:opacity-90"
            >
              {cleared ? <Check className="h-3.5 w-3.5 text-[#059669]" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>{cleared ? 'LOCAL DATA CLEARED' : 'CLEAR LOCAL DATA'}</span>
            </button>
            <span className="text-[11px] text-[var(--text-muted)]">
              Resets theme and removes custom planted graph nodes.
            </span>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <h2 className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <Scale className="h-4 w-4" /> Accessibility (AODA / WCAG 2.1 AA) &amp; Legal Notice
          </h2>

          <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
            <p>
              <strong className="text-[var(--text-primary)]">AODA &amp; WCAG 2.1 AA Conformance:</strong>{' '}
              This application is engineered to meet Ontario&apos;s Accessibility for Ontarians with Disabilities Act (AODA) and WCAG 2.1 Level AA standards, including &ge;4.5:1 text contrast in both Dark and Warm-Cream Light modes, semantic HTML5 landmarks, keyboard focus indicators, and screen-reader labels.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Informational &amp; Financial Disclaimer:</strong>{' '}
              All benchmark evaluations, equity quotes, component price indices, CapEx estimates, and TCO calculations are provided strictly for informational and educational purposes under the MIT License. Nothing on this site constitutes financial, investment, or legal advice.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Open-Source Software Attribution:</strong>{' '}
              Built with React 18, Vite, Tailwind CSS, TypeScript, Express, node-cron, and Lucide Icons. Source code is distributed under the MIT License at{' '}
              <a href="https://github.com/Graphinity-Lab/ai-index" target="_blank" rel="noreferrer" className="underline text-[var(--text-primary)]">
                github.com/Graphinity-Lab/ai-index
              </a>.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Accessibility Feedback:</strong>{' '}
              Report accessibility barriers to{' '}
              <a href="mailto:privacy@graphinitylab.com" className="underline text-[var(--text-primary)]">
                privacy@graphinitylab.com
              </a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
