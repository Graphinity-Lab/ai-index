import React from 'react';

interface SourceBadgeProps {
  sources: string[];
  onNavigateSources?: () => void;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  sources,
  onNavigateSources,
  className = '',
}) => {
  return (
    <div className={`tabular-mono flex flex-wrap items-center justify-end gap-1.5 text-[10px] ${className}`}>
      {sources.map((src) => (
        <button
          key={src}
          type="button"
          onClick={onNavigateSources}
          title={`View ${src} attribution & methodology`}
          className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-1.5 py-0.5 text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          SRC: {src}
        </button>
      ))}
    </div>
  );
};
