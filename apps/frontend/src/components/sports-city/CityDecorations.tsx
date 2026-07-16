import type { InfrastructureTier } from './level-styles';
import { TopDownCorridor, TopDownCrossing } from './illustrations/TopDownCorridor';
import {
  TopDownEntrance,
  TopDownGreenArea,
  TopDownParking,
} from './illustrations/TopDownDecorations';

type CityRoadProps = {
  tier: InfrastructureTier;
  direction: 'horizontal' | 'vertical';
  junction?: boolean;
  className?: string;
};

export function CityRoad({ tier, direction, junction = false, className = '' }: CityRoadProps) {
  if (junction) {
    return (
      <div className={`w-full h-full min-w-[20px] min-h-[20px] ${className}`}>
        <TopDownCrossing tier={tier} />
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <TopDownCorridor tier={tier} axis={direction} />
    </div>
  );
}

type ParkingLotProps = {
  tier: InfrastructureTier;
  className?: string;
};

export function ParkingLot({ tier, className = '' }: ParkingLotProps) {
  return (
    <div className={className}>
      <TopDownParking tier={tier} />
    </div>
  );
}

type GreenAreaProps = {
  tier: InfrastructureTier;
  variant?: 'trees' | 'benches' | 'fountain';
  className?: string;
};

export function GreenArea({ tier, variant = 'trees', className = '' }: GreenAreaProps) {
  const resolved =
    variant === 'fountain' && tier >= 3 ? 'fountain' : variant === 'benches' && tier < 3 ? 'benches' : 'trees';
  return (
    <div className={className}>
      <TopDownGreenArea tier={tier} variant={resolved} />
    </div>
  );
}

type EntranceGateProps = {
  tier: InfrastructureTier;
  clubName?: string;
};

export function EntranceGate({ tier, clubName }: EntranceGateProps) {
  return <TopDownEntrance tier={tier} clubName={clubName} />;
}
