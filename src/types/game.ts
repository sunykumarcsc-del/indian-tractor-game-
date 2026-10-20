/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VehicleType = 
  | 'tractor'
  | 'tractor_green'
  | 'tractor_blue'
  | 'tractor_classic'
  | 'tractor_mahindra'
  | 'tractor_sonalika'
  | 'tractor_massey'
  | 'hatchback'
  | 'sedan'
  | 'suv'
  | 'sports'
  | 'motorcycle'
  | 'truck';

export type TrolleyType = 'none' | 'grain_trolley' | 'sugarcane_trolley' | 'tanker' | 'cultivator';
export type FrontAttachment = 'none' | 'heavy_bumper' | 'dozer_bucket' | 'chrome_bullbar';
export type CabinStyle = 'open_canopy_dj' | 'enclosed_glass' | 'open_rollbar' | 'sunshade_flat';
export type RimColor = 'yellow' | 'white' | 'chrome' | 'red' | 'black';
export type TyreStyle = 'deep_lug' | 'monster_wide' | 'dual_rear';
export type SilencerStyle = 'straight_chrome' | 'punjab_flapper' | 'curved';

export interface TractorModSettings {
  trolleyType: TrolleyType;
  djSystem: boolean;
  frontAttachment: FrontAttachment;
  cabinStyle: CabinStyle;
  rimColor: RimColor;
  tyreStyle: TyreStyle;
  silencerStyle: SilencerStyle;
}

export const DEFAULT_TRACTOR_MODS: TractorModSettings = {
  trolleyType: 'grain_trolley',
  djSystem: true,
  frontAttachment: 'dozer_bucket',
  cabinStyle: 'open_canopy_dj',
  rimColor: 'yellow',
  tyreStyle: 'monster_wide',
  silencerStyle: 'punjab_flapper',
};

export interface VehicleConfig {
  id: VehicleType;
  name: string;
  hindiName: string;
  category: string;
  price: number;
  unlocked: boolean;
  color: string;
  maxSpeed: number; // in km/h
  acceleration: number;
  brakeForce: number;
  turnSpeed: number;
  mass: number;
  length: number;
  width: number;
  height: number;
  wheelRadius: number;
  description: string;
  hornType: 'truck' | 'car' | 'bike' | 'tractor';
  isTractor?: boolean;
  upgrades: {
    engine: number; // 0 - 3
    brakes: number; // 0 - 3
    handling: number; // 0 - 3
  };
}

export type TimeOfDay = 'day' | 'sunset' | 'night';
export type CameraMode = 'chase' | 'hood' | 'top' | 'cinematic';

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  reward: number;
  startPos: [number, number, number];
  targetPos: [number, number, number];
  targetRadius: number;
  targetName: string;
  timeLimit?: number; // seconds, optional
  requiredVehicleType?: VehicleType;
  icon: string;
}

export interface PlayerSaveData {
  money: number;
  selectedVehicleId: VehicleType;
  ownedVehicles: VehicleType[];
  vehicleColors: Record<string, string>;
  vehicleUpgrades: Record<string, { engine: number; brakes: number; handling: number }>;
  tractorMods: Record<string, TractorModSettings>;
  completedMissions: string[];
  soundEnabled: boolean;
  soundVolume: number;
  timeOfDay: TimeOfDay;
  touchControls: boolean;
}

export interface InputState {
  throttle: number; // -1 to 1
  steer: number; // -1 to 1
  brake: boolean;
  handbrake: boolean;
  horn: boolean;
  headlights: boolean;
  resetVehicle: boolean;
  toggleTrolley?: boolean;
  toggleDJ?: boolean;
}

export interface Landmark {
  id: string;
  name: string;
  type: 'village' | 'city' | 'highway' | 'toll' | 'fuel' | 'airport' | 'temple' | 'farm';
  pos: [number, number]; // x, z
  color: string;
}
