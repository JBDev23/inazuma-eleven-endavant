import type { FacilityId, FacilityLevel } from '../types';
import { TopDownFacilityIllustration } from './TopDownFacilities';

type BuildingIllustrationProps = {
  facilityId: FacilityId;
  level: FacilityLevel;
  accent: string;
};

const TOP_DOWN_IDS: FacilityId[] = ['shop', 'training', 'clinic', 'lab'];

export function BuildingIllustration({ facilityId, level, accent }: BuildingIllustrationProps) {
  if (TOP_DOWN_IDS.includes(facilityId)) {
    return <TopDownFacilityIllustration facilityId={facilityId} level={level} accent={accent} />;
  }

  return null;
}
