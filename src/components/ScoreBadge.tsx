'use client';

import { ScoreStatus } from '@/lib/types';

interface ScoreBadgeProps {
  status: ScoreStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  go: {
    label: 'GO',
    bgColor: 'bg-emerald-500',
    textColor: 'text-white',
    icon: '🎣',
  },
  maybe: {
    label: 'MAYBE',
    bgColor: 'bg-amber-500',
    textColor: 'text-white',
    icon: '🤔',
  },
  skip: {
    label: 'SKIP',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    icon: '⛔',
  },
};

const sizeClasses = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-xl',
};

export function ScoreBadge({ status, size = 'md' }: ScoreBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-2 font-bold rounded-full
        ${config.bgColor} ${config.textColor} ${sizeClasses[size]}
      `}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
