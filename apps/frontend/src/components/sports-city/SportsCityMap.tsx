'use client';

import { useState } from 'react';
import { FacilityZone } from './FacilityZone';
import { StadiumCompound } from './StadiumCompound';
import { CityRoad, EntranceGate, GreenArea, ParkingLot } from './CityDecorations';
import { CityGroundLayer } from './CityPathNetwork';
import { FacilityUpgradeModal } from './FacilityUpgradeModal';
import { FACILITY_CONFIG } from './facility-config';
import { getInfrastructureTier, GRASS_STYLES } from './level-styles';
import {
  facilitiesToState,
  getConstructionMap,
  type ClubFacilityRecord,
  type FacilityId,
} from './types';
import type { ClubResources } from '@inazuma/shared';

type SportsCityMapProps = {
  facilities: ClubFacilityRecord[];
  clubName?: string;
  resources: ClubResources;
  onUpgrade: (facilityId: FacilityId) => Promise<void>;
  onSetPitchElement?: (pitchElement: import('@inazuma/shared').NormalizedElement) => Promise<void>;
  isUpgrading?: boolean;
  isSavingPitchElement?: boolean;
};

export function SportsCityMap({
  facilities,
  clubName,
  resources,
  onUpgrade,
  onSetPitchElement,
  isUpgrading = false,
  isSavingPitchElement = false,
}: SportsCityMapProps) {
  const city = facilitiesToState(facilities);
  const construction = getConstructionMap(facilities);
  const [selectedId, setSelectedId] = useState<FacilityId | null>(null);

  const allLevels = Object.values(city);
  const infraTier = getInfrastructureTier(allLevels);
  const standaloneFacilities = FACILITY_CONFIG.filter((c) => !c.embeddedInStadium);

  const selectedFacility = selectedId
    ? facilities.find((f) => f.facilityId === selectedId) ?? null
    : null;

  const grassOverlay = (
    <div
      className="absolute inset-0 opacity-[0.18] pointer-events-none"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80px 60px at 20% 30%, rgba(34,197,94,0.15), transparent),
          radial-gradient(ellipse 100px 80px at 80% 70%, rgba(34,197,94,0.12), transparent),
          radial-gradient(ellipse 60px 50px at 50% 50%, rgba(34,197,94,0.08), transparent),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            rgba(0,0,0,0.06) 40px,
            rgba(0,0,0,0.06) 80px
          )
        `,
      }}
    />
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div
        className={`
          relative rounded-2xl md:rounded-3xl border-2 md:border-4 border-slate-800 overflow-hidden shadow-2xl
          bg-linear-to-br ${GRASS_STYLES[infraTier]}
        `}
      >
        {grassOverlay}

        {/* Móvil */}
        <div className="relative md:hidden">
          <div className="p-3 space-y-3">
            <div className="relative rounded-xl overflow-hidden">
              <CityGroundLayer tier={infraTier} className="z-0" />
              <div className="relative z-10 space-y-3 p-1">
                <EntranceGate tier={infraTier} clubName={clubName} />

                <StadiumCompound
                  fieldLevel={city.field}
                  standsLevel={city.stands}
                  benchesLevel={city.benches}
                  construction={construction}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />

                <div className="grid grid-cols-2 gap-2">
                  {standaloneFacilities.map((config) => (
                    <FacilityZone
                      key={config.id}
                      id={config.id}
                      level={city[config.id]}
                      underConstruction={construction[config.id] != null}
                      constructionTarget={construction[config.id]}
                      selected={selectedId === config.id}
                      onSelect={setSelectedId}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ParkingLot tier={infraTier} className="min-h-[72px]" />
                  <GreenArea
                    tier={infraTier}
                    variant={infraTier >= 3 ? 'fountain' : 'trees'}
                    className="min-h-[72px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Escritorio */}
        <div className="relative hidden md:block">
          <div className="relative p-6 overflow-x-auto">
            <div className="min-w-[720px] relative rounded-2xl overflow-hidden">
              <CityGroundLayer tier={infraTier} className="z-0" />

              <div className="relative z-10 space-y-2 p-1">
                <div className="flex justify-center px-4 pb-1">
                  <EntranceGate tier={infraTier} clubName={clubName} />
                </div>

                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: '1fr 28px 2fr 28px 1fr',
                    gridTemplateRows: 'auto 1fr 1fr',
                    gridTemplateAreas: `
                      "parking road-h1 shop road-h2 trees"
                      "training road-v1 stadium road-v2 clinic"
                      "green road-v1 stadium road-v2 lab"
                    `,
                  }}
                >
                  <div style={{ gridArea: 'parking' }} className="min-h-[80px] p-0.5">
                    <ParkingLot tier={infraTier} className="h-full" />
                  </div>

                  <div style={{ gridArea: 'road-h1' }} className="self-center min-h-[12px]">
                    <CityRoad tier={infraTier} direction="horizontal" />
                  </div>
                  <div style={{ gridArea: 'road-h2' }} className="self-center min-h-[12px]">
                    <CityRoad tier={infraTier} direction="horizontal" />
                  </div>
                  <div style={{ gridArea: 'road-v1' }} className="min-h-[80px]">
                    <CityRoad tier={infraTier} direction="vertical" />
                  </div>
                  <div style={{ gridArea: 'road-v2' }} className="min-h-[80px]">
                    <CityRoad tier={infraTier} direction="vertical" />
                  </div>

                  <div style={{ gridArea: 'trees' }} className="min-h-[60px] p-0.5">
                    <GreenArea tier={infraTier} variant="trees" className="h-full" />
                  </div>
                  <div style={{ gridArea: 'green' }} className="min-h-[40px] p-0.5">
                    <GreenArea tier={infraTier} variant={infraTier >= 3 ? 'fountain' : 'benches'} className="h-full" />
                  </div>

                  <div style={{ gridArea: 'stadium' }} className="min-h-[280px] p-0.5">
                    <StadiumCompound
                      fieldLevel={city.field}
                      standsLevel={city.stands}
                      benchesLevel={city.benches}
                      construction={construction}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                    />
                  </div>

                  {standaloneFacilities.map((config) => (
                    <div key={config.id} style={{ gridArea: config.gridArea }} className="p-0.5">
                      <FacilityZone
                        id={config.id}
                        level={city[config.id]}
                        underConstruction={construction[config.id] != null}
                        constructionTarget={construction[config.id]}
                        selected={selectedId === config.id}
                        onSelect={setSelectedId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedId && selectedFacility && (
        <FacilityUpgradeModal
          facilityId={selectedId}
          facility={selectedFacility}
          resources={resources}
          onClose={() => setSelectedId(null)}
          onUpgrade={onUpgrade}
          onSetPitchElement={onSetPitchElement}
          isLoading={isUpgrading}
          isSavingPitchElement={isSavingPitchElement}
        />
      )}
    </div>
  );
}
