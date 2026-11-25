import React from 'react';

interface BrandLogoProps {
  org: string;
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ org, size = 16, className = '' }) => {
  const key = org.toLowerCase();

  // Graphinity Lab: Precision interlocking G-frame / index nodes
  if (key.includes('graphinity') || key.includes('grphinity')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Graphinity Lab">
        <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M15.5 8.5h-5a2.5 2.5 0 00-2.5 2.5v2a2.5 2.5 0 002.5 2.5h5v-3.5h-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="15.5" cy="12" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  // OpenAI: Hexagonal aperture knot
  if (key.includes('openai')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="OpenAI">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 3v9m0 0l7.8-4.5M12 12l7.8 4.5M12 12v9m0-9l-7.8 4.5M12 12L4.2 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Anthropic: Dual slanted A-pillar
  if (key.includes('anthropic')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Anthropic">
        <path d="M4.5 19L10 5M14 5l5.5 14M7.5 14.5h5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Google / DeepMind / Gemma: 4-point precision star
  if (key.includes('google') || key.includes('gemma') || key.includes('alphabet')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Google">
        <path d="M12 2.5C12.8 8.2 15.8 11.2 21.5 12C15.8 12.8 12.8 15.8 12 21.5C11.2 15.8 8.2 12.8 2.5 12C8.2 11.2 11.2 8.2 12 2.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }

  // DeepSeek: Fin / wave geometry
  if (key.includes('deepseek')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="DeepSeek">
        <path d="M4 16c3-7 8-11 15-10-2 4-4 7-8 9 3 1 6 1 9 0-3 4-9 5-16 1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }

  // Meta: Continuous infinity loop
  if (key.includes('meta') || key.includes('llama')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Meta">
        <path d="M3.5 14.5c0-3.5 2-6.5 4.2-6.5 2.1 0 3.3 2.3 4.3 4.2 1-1.9 2.2-4.2 4.3-4.2 2.2 0 4.2 3 4.2 6.5 0 2.1-1.2 3.5-3 3.5-1.9 0-3.5-1.8-5.5-5.2C10 16.2 8.4 18 6.5 18c-1.8 0-3-1.4-3-3.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }

  // Qwen / Alibaba: Precision diamond-Q
  if (key.includes('qwen') || key.includes('alibaba')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Qwen">
        <rect x="5" y="5" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M14 14l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  // xAI: Diagonal slash X
  if (key.includes('xai') || key === 'x-ai') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="xAI">
        <path d="M5 4l14 16M19 4l-6 6.8M11 13.2L5 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }

  // Mistral: Stepped geometric M-blocks
  if (key.includes('mistral')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Mistral">
        <path d="M4 5h4v4h3v4h2V9h3V5h4v14h-4v-4h-3v4h-2v-4H8v4H4V5z" fill="currentColor" />
      </svg>
    );
  }

  // Moonshot / Kimi: Crescent + orbit
  if (key.includes('moonshot') || key.includes('kimi')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Moonshot">
        <path d="M16.5 17.5A7 7 0 019.5 5a7 7 0 107 12.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="17" cy="7" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  // Z.AI / GLM: Geometric Z
  if (key.includes('z.ai') || key.includes('glm')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Z.AI">
        <path d="M5 6h14L5 18h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Cohere: Interlocking capsules
  if (key.includes('cohere')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Cohere">
        <circle cx="9" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="15" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  // NVIDIA: Spiral eye / chip
  if (key.includes('nvidia') || key.includes('nvda') || key.includes('nemotron')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="NVIDIA">
        <path d="M3 12c2.5-4.5 6.5-6.5 11-6.5 3.5 0 6 2 7 4.5-2.5 4.5-6.5 6.5-11 6.5-2.5 0-4.5-1-5.5-2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="11.5" r="2.2" fill="currentColor" />
      </svg>
    );
  }

  // AMD: Corner arrow bracket
  if (key.includes('amd')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="AMD">
        <path d="M5 5h14v14l-4.5-4.5V9.5H9.5L5 5zm0 14l4.5-4.5H14v4.5H5z" fill="currentColor" />
      </svg>
    );
  }

  // Broadcom / AVGO: Pulse wave
  if (key.includes('broadcom') || key.includes('avgo')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Broadcom">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6.5 12h2.5l1.8-4 2.4 8 1.8-4h2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // TSMC / TSM: Wafer grid
  if (key.includes('tsmc') || key.includes('tsm') || key.includes('asml') || key.includes('micron') || key === 'mu' || key.includes('arm')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label={org}>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 3.5v17M3.5 12h17M6.5 6.5h11v11h-11z" stroke="currentColor" strokeWidth="1.2" opacity="0.8" />
      </svg>
    );
  }

  // Microsoft: 4-pane window
  if (key.includes('microsoft') || key.includes('msft') || key.includes('phi')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Microsoft">
        <rect x="4" y="4" width="7" height="7" fill="currentColor" />
        <rect x="13" y="4" width="7" height="7" fill="currentColor" />
        <rect x="4" y="13" width="7" height="7" fill="currentColor" />
        <rect x="13" y="13" width="7" height="7" fill="currentColor" />
      </svg>
    );
  }

  // Amazon / AWS: Smile arc
  if (key.includes('amazon') || key.includes('amzn') || key.includes('aws')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Amazon">
        <path d="M5 14c4 3.5 10 3.5 14 0M16.5 12.5l2.5 1.5-1.2 2.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 10l4-5 4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Default / AI2 / Oracle / Palantir: Precision cube
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label={org}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
};
