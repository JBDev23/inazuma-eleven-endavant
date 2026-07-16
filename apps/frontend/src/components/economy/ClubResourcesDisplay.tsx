import { CLUB_RESOURCES, type ClubResources } from '@inazuma/shared';
import { CLUB_RESOURCE_STYLES } from './club-resource-styles';

type Variant = 'grid' | 'inline' | 'hud';

interface ClubResourcesDisplayProps {
  resources: ClubResources;
  variant?: Variant;
  title?: string;
  className?: string;
}

export function ClubResourcesDisplay({
  resources,
  variant = 'inline',
  title,
  className = '',
}: ClubResourcesDisplayProps) {
  if (variant === 'grid') {
    return (
      <div className={className}>
        {title && (
          <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">{title}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CLUB_RESOURCES.map(({ key, short, name }) => {
            const style = CLUB_RESOURCE_STYLES[key];
            return (
              <div
                key={key}
                className={`rounded-xl border px-3 py-2.5 text-center ${style.border} ${style.bg}`}
                title={name}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                  {short}
                </p>
                <p className={`text-xl font-black tabular-nums ${style.text}`}>
                  {resources[key].toLocaleString('es-ES')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === 'hud') {
    return (
      <div
        className={`bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-2.5 shadow-xl ${className}`}
      >
        {title && (
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 px-1">
            {title}
          </p>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          {CLUB_RESOURCES.map(({ key, short, name }) => {
            const style = CLUB_RESOURCE_STYLES[key];
            return (
              <div
                key={key}
                className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1 ${style.border} ${style.bg}`}
                title={name}
              >
                <span className="text-[10px] font-black uppercase text-slate-500">{short}</span>
                <span className={`text-sm font-black tabular-nums ${style.text}`}>
                  {resources[key].toLocaleString('es-ES')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {title && (
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-1">
          {title}
        </span>
      )}
      {CLUB_RESOURCES.map(({ key, short, name }) => {
        const style = CLUB_RESOURCE_STYLES[key];
        return (
          <div
            key={key}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${style.border} ${style.bg}`}
            title={name}
          >
            <span className="text-[10px] font-black uppercase text-slate-500">{short}</span>
            <span className={`text-sm font-black tabular-nums ${style.text}`}>
              {resources[key].toLocaleString('es-ES')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
