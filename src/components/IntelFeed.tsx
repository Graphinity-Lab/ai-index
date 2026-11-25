import React, { useMemo, useState } from 'react';
import { ExternalLink, Newspaper, Search } from 'lucide-react';
import { SourceBadge } from './SourceBadge.tsx';
import type { NewsCategory, NewsItem } from '../types.ts';

interface IntelFeedProps {
  news: NewsItem[];
  onNavigateSources?: () => void;
}

const CATEGORIES: Array<'ALL' | NewsCategory> = [
  'ALL',
  'MODELS',
  'BENCHMARKS',
  'SILICON',
  'MARKETS & IPOS',
];

function decodeEntities(raw: string): string {
  const named: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&rsquo;': '’',
    '&lsquo;': '‘',
    '&rdquo;': '”',
    '&ldquo;': '“',
    '&ndash;': '-',
    '&mdash;': '-',
    '&hellip;': '…',
    '&nbsp;': ' ',
  };
  return raw
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&[a-zA-Z0-9#]+;/g, (ent) => named[ent] ?? ent)
    .replace(/\u2014/g, '-');
}

function formatRelative(iso: string): string {
  const diffH = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 3600000));
  if (diffH < 1) return 'JUST NOW';
  if (diffH < 24) return `${diffH}H AGO`;
  return `${Math.round(diffH / 24)}D AGO`;
}

export const IntelFeed: React.FC<IntelFeedProps> = ({ news, onNavigateSources }) => {
  const [category, setCategory] = useState<'ALL' | NewsCategory>('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return news.filter((item) => {
      if (category !== 'ALL' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      );
    });
  }, [news, category, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="tabular-mono flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded border px-2.5 py-1 text-[11px] transition-colors ${
                category === cat
                  ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search live intel feed..."
            className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col justify-between rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--border-strong)]"
          >
            <div>
              <div className="tabular-mono flex items-center justify-between gap-2 text-[10px]">
                <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-0.5 font-medium text-[var(--text-primary)]">
                  {item.category}
                </span>
                <span className="text-[var(--text-muted)]">
                  {item.source} • {formatRelative(item.publishedAt)}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)] group-hover:underline">
                {decodeEntities(item.title)}
              </h3>
              {item.summary && (
                <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-3">{decodeEntities(item.summary)}</p>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
              <Newspaper className="h-3 w-3" /> Read Source <ExternalLink className="h-3 w-3" />
            </div>
          </a>
        ))}
      </div>
      <SourceBadge sources={['Hugging Face Blog', 'Ars Technica', 'TechCrunch AI']} onNavigateSources={onNavigateSources} />
    </section>
  );
};
