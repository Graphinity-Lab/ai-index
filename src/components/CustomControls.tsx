import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps<T extends string> {
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (val: T) => void;
  placeholder?: string;
  className?: string;
  menuClassName?: string;
}

export function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className = '',
  menuClassName = '',
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tabular-mono flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-[var(--text-primary)] focus:outline-none"
      >
        <span className="truncate">{active ? active.label : placeholder}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] p-1 shadow-xl ${menuClassName}`}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`tabular-mono flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-xs transition-colors ${
                  selected
                    ? 'bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-sub)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-[#059669]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CustomSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  accentColor?: string;
  className?: string;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  accentColor = '#0891B2',
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100));

  const updateFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.min(max, Math.max(min, Number(stepped.toFixed(4))));
    onChange(clamped);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => updateFromClientX(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, min, max, step]);

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          onChange(Math.min(max, Number((value + step).toFixed(4))));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          onChange(Math.max(min, Number((value - step).toFixed(4))));
        }
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        setDragging(true);
        updateFromClientX(e.clientX);
      }}
      className={`relative flex h-5 w-full cursor-pointer touch-none select-none items-center ${className}`}
    >
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)] ring-1 ring-[var(--border-hairline)]">
        <div
          className="h-full rounded-full transition-[width] duration-75"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
        />
      </div>
      <div
        className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[var(--bg-surface)] transition-transform ${
          dragging ? 'scale-125' : 'hover:scale-110'
        }`}
        style={{
          left: `${pct}%`,
          borderColor: accentColor,
          boxShadow: dragging ? `0 0 0 4px color-mix(in srgb, ${accentColor} 20%, transparent)` : undefined,
        }}
      />
    </div>
  );
};

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  label,
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className="inline-flex items-center gap-2 text-left text-xs text-[var(--text-primary)] focus:outline-none"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked
            ? 'border-[#059669] bg-[#059669] text-white'
            : 'border-[var(--border-strong)] bg-[var(--bg-sub)] hover:border-[var(--text-secondary)]'
        }`}
      >
        {checked && <Check className="h-3 w-3 stroke-[2.5]" />}
      </span>
      {label && <span>{label}</span>}
    </button>
  );
};
