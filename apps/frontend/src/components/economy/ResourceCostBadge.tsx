import { CLUB_RESOURCE_META, type ClubResourceKey } from '@inazuma/shared';
import { CLUB_RESOURCE_STYLES } from './club-resource-styles';

interface ResourceCostBadgeProps {
  amount: number;
  resource?: ClubResourceKey;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

export function ResourceCostBadge({
  amount,
  resource = 'pp',
  size = 'md',
  className = '',
}: ResourceCostBadgeProps) {
  const meta = CLUB_RESOURCE_META[resource];
  const style = CLUB_RESOURCE_STYLES[resource];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-black tabular-nums uppercase ${SIZE_CLASSES[size]} ${style.badge} ${className}`}
      title={meta.name}
    >
      <span>{amount.toLocaleString('es-ES')}</span>
      <span className="opacity-80">{meta.short}</span>
    </span>
  );
}
