/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  VehicleConfig,
  VehicleType,
  TractorModSettings,
  TrolleyType,
  FrontAttachment,
  CabinStyle,
  RimColor,
  TyreStyle,
  SilencerStyle,
  DEFAULT_TRACTOR_MODS,
} from '../types/game';
import {
  createTruckTailgateTexture,
  createTractorGrilleTexture,
  createTractorDashboardTexture,
  createWeightBlockTexture,
  createTrolleySacksTexture,
  createDJSpeakerTexture,
  createTankerTexture,
  createSugarcaneTexture,
  createDozerBucketTexture,
  createCultivatorBrandTexture,
} from './proceduralTextures';

export interface VehicleRig {
  group: THREE.Group;
  config: VehicleConfig;
  frontWheels: THREE.Object3D[];
  rearWheels: THREE.Object3D[];
  allWheels: THREE.Object3D[];
  bodyMesh: THREE.Mesh;
  headlightMeshes: THREE.Mesh[];
  brakeLightMeshes: THREE.Mesh[];
  headlightLights: THREE.SpotLight[];
  exhaustPos: THREE.Vector3;
  // Tractor and Trolley specific
  trolleyGroup?: THREE.Group;
  trolleyWheels?: THREE.Object3D[];
  trolleyHeading?: number;
  trolleyType?: TrolleyType;
  trolleyHitchOffset?: number; // distance from vehicle origin to hitch pin
  trolleyDrawbarLength?: number;
  djActive?: boolean;
  speakerMeshes?: THREE.Mesh[];
  farmerMesh?: THREE.Group;
  dozerGroup?: THREE.Group;
  activeMods?: TractorModSettings;
  setBraking: (braking: boolean) => void;
  setHeadlights: (on: boolean) => void;
  updateColor: (color: string) => void;
  updateModifications?: (mods: TractorModSettings) => void;
  setDJActive?: (active: boolean) => void;
}

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  tractor: {
    id: 'tractor',
    name: 'Swaraj 855 FE Red (DJ Modified)',
    hindiName: 'स्वराज 855 डीजे मॉडिफाइड',
    category: 'Modified Agricultural',
    price: 0,
    unlocked: true,
    color: '#dc2626', // Classic Red
    maxSpeed: 68,
    acceleration: 34,
    brakeForce: 48,
    turnSpeed: 2.5,
    mass: 3500,
    length: 4.4,
    width: 2.4,
    height: 2.9,
    wheelRadius: 0.96,
    isTractor: true,
    description: 'Iconic Indian red tractor with authentic Punjabi DJ sound system, heavy front dozer/bumper, and massive deep-tread agricultural tyres.',
    hornType: 'tractor',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  tractor_green: {
    id: 'tractor_green',
    name: 'John Deere 5310 Green Power Cabin',
    hindiName: 'जॉन डियर 5310 केबिन',
    category: 'Heavy Duty Cabin',
    price: 5500,
    unlocked: true,
    color: '#16a34a', // Signature John Deere Green
    maxSpeed: 70,
    acceleration: 36,
    brakeForce: 50,
    turnSpeed: 2.4,
    mass: 3800,
    length: 4.6,
    width: 2.4,
    height: 3.1,
    wheelRadius: 0.98,
    isTractor: true,
    description: 'High-horsepower modern green agricultural tractor with luxury glass ROPS cabin, yellow deep-dish rims, and heavy pulling capacity.',
    hornType: 'tractor',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  tractor_blue: {
    id: 'tractor_blue',
    name: 'New Holland 3630 Blue King',
    hindiName: 'न्यू हॉलैंड 3630 ब्लू किंग',
    category: 'High-Torque Farming',
    price: 7000,
    unlocked: false,
    color: '#1d4ed8', // Royal Blue
    maxSpeed: 72,
    acceleration: 37,
    brakeForce: 49,
    turnSpeed: 2.5,
    mass: 3600,
    length: 4.5,
    width: 2.35,
    height: 3.0,
    wheelRadius: 0.96,
    isTractor: true,
    description: 'Powerful blue agricultural tractor with aerodynamic styling, rear cultivator linkage, and deep-tread field tires.',
    hornType: 'tractor',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  tractor_classic: {
    id: 'tractor_classic',
    name: 'Swaraj 855 Sarpanch Classic',
    hindiName: 'स्वराज सरपंच क्लासिक (नीला-सफेद)',
    category: 'Classic Punjabi Tractor',
    price: 4500,
    unlocked: false,
    color: '#0284c7', // Sky Blue with white trim
    maxSpeed: 64,
    acceleration: 32,
    brakeForce: 45,
    turnSpeed: 2.4,
    mass: 3300,
    length: 4.3,
    width: 2.3,
    height: 2.8,
    wheelRadius: 0.96,
    isTractor: true,
    description: 'The pride of the village! Classic dual-tone blue and white Punjabi tractor with chrome straight exhaust, driver in kurta, and farm trolley.',
    hornType: 'tractor',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  tractor_mahindra: {
    id: 'tractor_mahindra',
    name: 'Mahindra 575 DI Bhoomiputra',
    hindiName: 'महिंद्रा 575 डीआई भूमिपुत्र',
    category: 'Village Workhorse',
    price: 6000,
    unlocked: false,
    color: '#b91c1c', // Crimson Red with Yellow trim
    maxSpeed: 66,
    acceleration: 35,
    brakeForce: 48,
    turnSpeed: 2.5,
    mass: 3450,
    length: 4.4,
    width: 2.3,
    height: 2.85,
    wheelRadius: 0.96,
    isTractor: true,
    description: 'Legendary Indian farm powerhouse. Renowned for raw low-end torque, sturdy mechanical reliability, and unyielding pulling stamina.',
    hornType: 'tractor',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  tractor_sonalika: {
    id: 'tractor_sonalika',
    name: 'Sonalika Sikander Tiger HD',
    hindiName: 'सोनालीका सिकंदर टाइगर',
    category: 'Heavy Duty Monster',
    price: 8500,
    unlocked: false,
    color: '#0f172a', // Obsidian Black & Gold
    maxSpeed: 75,
    acceleration: 40,
    brakeForce: 52,
    turnSpeed: 2.6,
    mass: 3900,
    length: 4.7,
    width: 2.45,
    height: 3.0,
    wheelRadius: 1.0,
    isTractor: true,
    description: 'Aggressive modern black & gold tractor with twin projector headlights, wide dual-wheel option, and maximum drawbar pull.',
    hornType: 'tractor',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  tractor_massey: {
    id: 'tractor_massey',
    name: 'Massey Ferguson 241 Maha Shakti',
    hindiName: 'मैसी फर्ग्यूसन 241 महाशक्ति',
    category: 'Heritage Agricultural',
    price: 5200,
    unlocked: false,
    color: '#ef4444', // Classic Massey Red & Grey
    maxSpeed: 63,
    acceleration: 33,
    brakeForce: 46,
    turnSpeed: 2.5,
    mass: 3200,
    length: 4.2,
    width: 2.25,
    height: 2.75,
    wheelRadius: 0.94,
    isTractor: true,
    description: 'Timeless vintage agricultural tractor with curved rounded nose, high ground clearance, and nimble village maneuverability.',
    hornType: 'tractor',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  hatchback: {
    id: 'hatchback',
    name: 'Swift City Hatch',
    hindiName: 'हैचबैक कार',
    category: 'City Compact',
    price: 4000,
    unlocked: true,
    color: '#2563eb', // Royal Blue
    maxSpeed: 110,
    acceleration: 38,
    brakeForce: 45,
    turnSpeed: 2.8,
    mass: 1050,
    length: 3.9,
    width: 1.8,
    height: 1.5,
    wheelRadius: 0.35,
    description: 'Nimble and fuel-efficient. Perfect for weaving through crowded village alleys and city traffic.',
    hornType: 'car',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  sedan: {
    id: 'sedan',
    name: 'Royal Cruiser Sedan',
    hindiName: 'रॉयल सेडान',
    category: 'Executive Sedan',
    price: 8000,
    unlocked: false,
    color: '#f8fafc', // Pearl White
    maxSpeed: 135,
    acceleration: 44,
    brakeForce: 50,
    turnSpeed: 2.5,
    mass: 1350,
    length: 4.6,
    width: 1.9,
    height: 1.45,
    wheelRadius: 0.38,
    description: 'Comfortable family cruiser with smooth suspension, ideal for long highway journeys on NH-44.',
    hornType: 'car',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  suv: {
    id: 'suv',
    name: 'Mahindra Desert 4x4',
    hindiName: 'महिंद्रा थार SUV',
    category: 'Off-Road SUV',
    price: 15000,
    unlocked: false,
    color: '#1e293b', // Midnight Black
    maxSpeed: 130,
    acceleration: 42,
    brakeForce: 48,
    turnSpeed: 2.4,
    mass: 1850,
    length: 4.4,
    width: 2.0,
    height: 1.95,
    wheelRadius: 0.46,
    description: 'Rugged Indian 4x4 with roof carrier, bull-bar, and high ground clearance for rough terrain.',
    hornType: 'car',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  sports: {
    id: 'sports',
    name: 'Raftar GT Supercar',
    hindiName: 'रफ्तार सुपरकार',
    category: 'Exotic Sport',
    price: 35000,
    unlocked: false,
    color: '#f97316', // Racing Saffron Orange
    maxSpeed: 185,
    acceleration: 68,
    brakeForce: 65,
    turnSpeed: 3.2,
    mass: 1200,
    length: 4.5,
    width: 2.1,
    height: 1.2,
    wheelRadius: 0.36,
    description: 'Ultra-fast supercar with track-tuned handling, rear wing spoiler, and exhilarating highway speed.',
    hornType: 'car',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  motorcycle: {
    id: 'motorcycle',
    name: 'Bullet 350 Classic',
    hindiName: 'बुलेट 350',
    category: 'Classic Cruiser',
    price: 6500,
    unlocked: false,
    color: '#0f172a', // Jet Black with Chrome
    maxSpeed: 95,
    acceleration: 40,
    brakeForce: 42,
    turnSpeed: 3.4,
    mass: 280,
    length: 2.3,
    width: 0.9,
    height: 1.25,
    wheelRadius: 0.38,
    description: 'The legendary thumping sound of the Indian countryside. Agile, iconic, and effortless to steer.',
    hornType: 'bike',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
  truck: {
    id: 'truck',
    name: 'Desi Goods Carrier 407',
    hindiName: 'देसी ट्रक मालगाड़ी',
    category: 'Heavy Commercial',
    price: 22000,
    unlocked: false,
    color: '#ca8a04', // Vibrant Mustard Ochre
    maxSpeed: 85,
    acceleration: 28,
    brakeForce: 40,
    turnSpeed: 1.9,
    mass: 3800,
    length: 6.2,
    width: 2.3,
    height: 2.8,
    wheelRadius: 0.52,
    description: 'Authentic Indian highway truck with wooden-deck body, Horn OK Please artwork, and heavy cargo capacity.',
    hornType: 'truck',
    upgrades: { engine: 0, brakes: 0, handling: 0 },
  },
};

// Standard wheel helper generator for cars, SUVs, trucks
function createWheel(radius: number, width: number): THREE.Group {
  const wheel = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.9,
    metalness: 0.1,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheel.add(tire);

  // Rim
  const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width + 0.02, 16);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: '#d1d5db',
    roughness: 0.3,
    metalness: 0.8,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheel.add(rim);

  // Center hub
  const hubGeo = new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, width + 0.04, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const hubMat = new THREE.MeshStandardMaterial({ color: '#374151', metalness: 0.9, roughness: 0.2 });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  wheel.add(hub);

  return wheel;
}

// Convert rim color name to hex
function getRimHex(colorName?: RimColor): string {
  switch (colorName) {
    case 'yellow': return '#fef08a'; // classic agri yellow
    case 'white': return '#f8fafc';
    case 'chrome': return '#f1f5f9';
    case 'red': return '#dc2626';
    case 'black': return '#18181b';
    default: return '#fef08a';
  }
}

// Realistic Agricultural Tractor Wheel with deep herringbone chevron treads and planetary hub
// Supports monster_wide, dual_rear, and customizable rim color (Yellow, White, Chrome, Red, Black)
export function createAgriculturalTractorWheel(
  radius: number,
  baseWidth: number,
  isRear: boolean,
  rimColor: RimColor = 'yellow',
  tyreStyle: TyreStyle = 'deep_lug'
): THREE.Group {
  const root = new THREE.Group();

  const width = tyreStyle === 'monster_wide' && isRear ? baseWidth * 1.35 : baseWidth;
  const rimHex = getRimHex(rimColor);

  const rimMat = new THREE.MeshStandardMaterial({
    color: rimHex,
    roughness: rimColor === 'chrome' ? 0.15 : 0.32,
    metalness: rimColor === 'chrome' ? 0.95 : 0.7,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: '#121214',
    roughness: 0.94,
    metalness: 0.05,
  });

  const hubMat = new THREE.MeshStandardMaterial({
    color: '#27272a',
    metalness: 0.88,
    roughness: 0.25,
  });

  const lugMat = new THREE.MeshStandardMaterial({
    color: '#0a0a0c',
    roughness: 0.96,
  });

  // Helper to build a single wheel disk + chevron lugs
  const buildSingleTireUnit = (wOffset: number, subWidth: number) => {
    const unit = new THREE.Group();
    unit.position.x = wOffset;

    // Tire carcass
    const tireGeo = new THREE.CylinderGeometry(radius, radius, subWidth, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    unit.add(tire);

    // Deep-dish pressed rim
    const rimRadius = radius * (isRear ? 0.62 : 0.66);
    const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, subWidth * 0.88, 20);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    unit.add(rim);

    // Recessed center dish
    const diskGeo = new THREE.CylinderGeometry(rimRadius * 0.78, rimRadius * 0.78, subWidth * 0.22, 16);
    diskGeo.rotateZ(Math.PI / 2);
    const disk = new THREE.Mesh(diskGeo, rimMat);
    unit.add(disk);

    // Center hub
    const hubRadius = rimRadius * 0.38;
    const hubGeo = new THREE.CylinderGeometry(hubRadius, hubRadius, subWidth * 0.95, 12);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    unit.add(hub);

    // 8 heavy bolt studs
    for (let b = 0; b < 8; b++) {
      const boltAngle = (b / 8) * Math.PI * 2;
      const boltGeo = new THREE.CylinderGeometry(0.024, 0.024, subWidth * 1.02, 6);
      boltGeo.rotateZ(Math.PI / 2);
      const boltMat = new THREE.MeshStandardMaterial({ color: '#e4e4e7', metalness: 0.95, roughness: 0.2 });
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.position.set(0, Math.sin(boltAngle) * hubRadius * 0.68, Math.cos(boltAngle) * hubRadius * 0.68);
      unit.add(bolt);
    }

    // Heavy chevron herringbone traction lugs (Apollo / MRF farm tyre style)
    const lugCount = isRear ? 18 : 14;
    const lugHeight = isRear ? (tyreStyle === 'monster_wide' ? 0.12 : 0.095) : 0.06;
    const lugDepth = isRear ? radius * 0.24 : radius * 0.18;
    const lugWidth = subWidth * 0.44;

    for (let i = 0; i < lugCount; i++) {
      const angle = (i / lugCount) * Math.PI * 2;

      // Left chevron lug
      const lugLGeo = new THREE.BoxGeometry(lugWidth, lugHeight, lugDepth);
      const lugL = new THREE.Mesh(lugLGeo, lugMat);
      lugL.position.set(
        -subWidth * 0.22,
        Math.cos(angle) * (radius + lugHeight * 0.45),
        Math.sin(angle) * (radius + lugHeight * 0.45)
      );
      lugL.rotation.x = angle;
      lugL.rotation.y = 0.36; // forward sweep
      unit.add(lugL);

      // Right chevron lug
      const angleR = angle + Math.PI / lugCount;
      const lugRGeo = new THREE.BoxGeometry(lugWidth, lugHeight, lugDepth);
      const lugR = new THREE.Mesh(lugRGeo, lugMat);
      lugR.position.set(
        subWidth * 0.22,
        Math.cos(angleR) * (radius + lugHeight * 0.45),
        Math.sin(angleR) * (radius + lugHeight * 0.45)
      );
      lugR.rotation.x = angleR;
      lugR.rotation.y = -0.36;
      unit.add(lugR);
    }

    return unit;
  };

  if (isRear && tyreStyle === 'dual_rear') {
    // Twin / Dual Rear Tyres (Tochan / Pull competition style!)
    const subW = width * 0.75;
    const innerTire = buildSingleTireUnit(-subW * 0.58, subW);
    const outerTire = buildSingleTireUnit(subW * 0.58, subW);
    root.add(innerTire);
    root.add(outerTire);

    // Connecting spacer spool
    const spacer = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.4, radius * 0.4, subW * 0.9, 12),
      hubMat
    );
    spacer.rotation.z = Math.PI / 2;
    root.add(spacer);
  } else {
    // Single tyre (standard or monster wide)
    root.add(buildSingleTireUnit(0, width));
  }

  return root;
}

// 3D Procedural Indian Farmer Driver Character
function createFarmerDriver(): THREE.Group {
  const farmer = new THREE.Group();
  farmer.name = 'farmer_driver';

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: '#c68642', roughness: 0.8 }); // Indian skin tone
  const clothMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 }); // White Kurta/Vest
  const pantsMat = new THREE.MeshStandardMaterial({ color: '#0369a1', roughness: 0.9 }); // Blue Jeans / Pajama
  const turbanMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.85 }); // Punjabi Saffron Pagri / Turban

  // Torso / Chest (sitting in driver seat)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.26), clothMat);
  torso.position.set(0, 0.44, 0);
  torso.castShadow = true;
  farmer.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), skinMat);
  head.position.set(0, 0.76, 0.02);
  farmer.add(head);

  // Saffron Turban / Pagri (Iconic Punjabi look)
  const turban = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.14, 12), turbanMat);
  turban.position.set(0, 0.84, 0.02);
  turban.rotation.x = -0.1;
  farmer.add(turban);

  // Turban crest / knot
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), turbanMat);
  crest.position.set(0, 0.9, 0.1);
  farmer.add(crest);

  // Left Arm reaching to steering wheel
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.1), clothMat);
  armL.position.set(-0.24, 0.44, 0.18);
  armL.rotation.x = Math.PI / 4;
  armL.rotation.z = 0.2;
  farmer.add(armL);

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skinMat);
  handL.position.set(-0.2, 0.32, 0.34);
  farmer.add(handL);

  // Right Arm reaching to steering wheel
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.1), clothMat);
  armR.position.set(0.24, 0.44, 0.18);
  armR.rotation.x = Math.PI / 4;
  armR.rotation.z = -0.2;
  farmer.add(armR);

  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skinMat);
  handR.position.set(0.2, 0.32, 0.34);
  farmer.add(handR);

  // Legs (seated forward)
  for (let lx of [-0.12, 0.12]) {
    const upperLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.38), pantsMat);
    upperLeg.position.set(lx, 0.22, 0.16);
    farmer.add(upperLeg);

    const lowerLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), pantsMat);
    lowerLeg.position.set(lx, 0.05, 0.36);
    farmer.add(lowerLeg);
  }

  return farmer;
}

// Build Agricultural Trolley / Implement Mesh
export function buildTrolleyMesh(
  type: TrolleyType,
  rimColor: RimColor = 'yellow'
): { group: THREE.Group; wheels: THREE.Object3D[]; drawbarLength: number } {
  const trolleyGroup = new THREE.Group();
  trolleyGroup.name = `trolley_${type}`;
  const wheels: THREE.Object3D[] = [];

  const steelMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8, metalness: 0.4 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.15, metalness: 0.95 });

  if (type === 'grain_trolley') {
    // ========================================================
    // 1. DESI GRAIN TROLLEY (Hitch eyelet at z = 0 for perfect articulation)
    // ========================================================
    const drawbarLength = 3.0; // Distance from hitch pin to axle center

    // Front hitch eyelet / ring (exact pivot point at z = 0, y = 0.55)
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 16), chromeMat);
    eyelet.position.set(0, 0.55, 0);
    eyelet.rotation.x = Math.PI / 2;
    trolleyGroup.add(eyelet);

    // Drawbar hitch A-frame connecting from hitch pin (z=0) to trolley body (z=-1.25)
    const hitchPoleL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), steelMat);
    hitchPoleL.position.set(-0.35, 0.55, -0.65);
    hitchPoleL.rotation.x = Math.PI / 2;
    hitchPoleL.rotation.z = 0.28;
    trolleyGroup.add(hitchPoleL);

    const hitchPoleR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), steelMat);
    hitchPoleR.position.set(0.35, 0.55, -0.65);
    hitchPoleR.rotation.x = Math.PI / 2;
    hitchPoleR.rotation.z = -0.28;
    trolleyGroup.add(hitchPoleR);

    // Heavy Chassis Bed Frame
    const frameGeo = new THREE.BoxGeometry(2.3, 0.24, 4.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.6, metalness: 0.3 }); // Navy blue frame
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.85, -3.2);
    frame.castShadow = true;
    trolleyGroup.add(frame);

    // Trolley Sideboards (Indian Farm Green with Red Trims)
    const boardMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 }); // Green body
    const trimMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.7 }); // Red trim

    // Left wall
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 4.2), boardMat);
    wallL.position.set(-1.12, 1.45, -3.2);
    trolleyGroup.add(wallL);

    // Right wall
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 4.2), boardMat);
    wallR.position.set(1.12, 1.45, -3.2);
    trolleyGroup.add(wallR);

    // Front headboard
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.36, 1.1, 0.12), boardMat);
    headboard.position.set(0, 1.45, -1.1);
    trolleyGroup.add(headboard);

    // Rear Tailgate with Truck Art & Dipper Sign
    const tailgateTex = createTruckTailgateTexture();
    const tailMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.34, 1.1), new THREE.MeshStandardMaterial({ map: tailgateTex, roughness: 0.8 }));
    tailMesh.position.set(0, 1.45, -5.31);
    tailMesh.rotation.y = Math.PI;
    trolleyGroup.add(tailMesh);

    // Reflective hazard chevron tape strips along bottom
    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 4.2), trimMat);
    stripL.position.set(-1.18, 1.95, -3.2);
    const stripR = stripL.clone();
    stripR.position.x = 1.18;
    trolleyGroup.add(stripL, stripR);

    // Cargo Load: Pyramid stacks of burlap jute grain sacks (50kg Wheat Sacks from image 1 & 5!)
    const sackTex = createTrolleySacksTexture();
    const sackMat = new THREE.MeshStandardMaterial({ map: sackTex, roughness: 0.95 });

    // Base sack layer
    const sackLayer1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 3.8), sackMat);
    sackLayer1.position.set(0, 1.25, -3.2);
    sackLayer1.castShadow = true;
    trolleyGroup.add(sackLayer1);

    // Middle sack layer
    const sackLayer2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 3.4), sackMat);
    sackLayer2.position.set(0, 1.85, -3.2);
    sackLayer2.castShadow = true;
    trolleyGroup.add(sackLayer2);

    // Top pyramid sack stack (towering high load like image 5!)
    const sackTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 2.9), sackMat);
    sackTop.position.set(0, 2.45, -3.2);
    sackTop.castShadow = true;
    trolleyGroup.add(sackTop);

    // Cargo tie-down ropes
    for (let rz of [-4.4, -3.2, -2.0]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.7, 6), steelMat);
      rope.position.set(0, 2.1, rz);
      rope.rotation.z = Math.PI / 2;
      trolleyGroup.add(rope);
    }

    // Axles & 4 Agricultural Wheels (2 Front Axle, 2 Rear Axle)
    const axleGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.1, 8);
    axleGeo.rotateZ(Math.PI / 2);

    const axle1 = new THREE.Mesh(axleGeo, steelMat);
    axle1.position.set(0, 0.52, -2.4);
    trolleyGroup.add(axle1);

    const axle2 = new THREE.Mesh(axleGeo, steelMat);
    axle2.position.set(0, 0.52, -4.0);
    trolleyGroup.add(axle2);

    // 4 Trolley Wheels
    const w1L = createAgriculturalTractorWheel(0.52, 0.32, false, rimColor, 'deep_lug');
    w1L.position.set(-1.18, 0.52, -2.4);
    const w1R = createAgriculturalTractorWheel(0.52, 0.32, false, rimColor, 'deep_lug');
    w1R.position.set(1.18, 0.52, -2.4);

    const w2L = createAgriculturalTractorWheel(0.52, 0.32, false, rimColor, 'deep_lug');
    w2L.position.set(-1.18, 0.52, -4.0);
    const w2R = createAgriculturalTractorWheel(0.52, 0.32, false, rimColor, 'deep_lug');
    w2R.position.set(1.18, 0.52, -4.0);

    trolleyGroup.add(w1L, w1R, w2L, w2R);
    wheels.push(w1L, w1R, w2L, w2R);

    return { group: trolleyGroup, wheels, drawbarLength };

  } else if (type === 'sugarcane_trolley') {
    // ========================================================
    // 2. SUGARCANE / STRAW HIGH-CAGE TROLLEY
    // ========================================================
    const drawbarLength = 3.0;

    // Eyelet at z = 0
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 16), chromeMat);
    eyelet.position.set(0, 0.55, 0);
    eyelet.rotation.x = Math.PI / 2;
    trolleyGroup.add(eyelet);

    // Drawbar
    const hitchPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), steelMat);
    hitchPole.position.set(0, 0.55, -0.7);
    hitchPole.rotation.x = Math.PI / 2;
    trolleyGroup.add(hitchPole);

    // Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.24, 4.4), steelMat);
    frame.position.set(0, 0.85, -3.4);
    trolleyGroup.add(frame);

    // High Steel Mesh / Pipe Cage Frame
    const pipeMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.6, metalness: 0.4 });
    for (let x of [-1.15, 1.15]) {
      for (let z of [-5.5, -4.4, -3.3, -2.2, -1.2]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), pipeMat);
        post.position.set(x, 1.85, z);
        trolleyGroup.add(post);
      }
      for (let y of [1.3, 1.8, 2.3, 2.7]) {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.3, 8), pipeMat);
        rail.position.set(x, y, -3.4);
        rail.rotation.x = Math.PI / 2;
        trolleyGroup.add(rail);
      }
    }

    // Sugarcane load
    const caneTex = createSugarcaneTexture();
    const caneMat = new THREE.MeshStandardMaterial({ map: caneTex, roughness: 0.9 });
    const caneLoad = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.8, 4.1), caneMat);
    caneLoad.position.set(0, 1.8, -3.4);
    caneLoad.castShadow = true;
    trolleyGroup.add(caneLoad);

    // 4 Wheels
    const axleGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.1, 8);
    axleGeo.rotateZ(Math.PI / 2);
    const axle1 = new THREE.Mesh(axleGeo, steelMat);
    axle1.position.set(0, 0.52, -2.6);
    const axle2 = new THREE.Mesh(axleGeo, steelMat);
    axle2.position.set(0, 0.52, -4.2);
    trolleyGroup.add(axle1, axle2);

    const w1L = createAgriculturalTractorWheel(0.52, 0.32, false, rimColor, 'deep_lug');
    w1L.position.set(-1.18, 0.52, -2.6);
    const w1R = createAgriculturalTractorWheel(0.52, 0.32, false, rimColor, 'deep_lug');
    w1R.position.set(1.18, 0.52, -2.6);
    const w2L = createAgriculturalTractorWheel(0.52, 0.32, false, rimColor, 'deep_lug');
    w2L.position.set(-1.18, 0.52, -4.2);
    const w2R = createAgriculturalTractorWheel(0.52, 0.32, false, rimColor, 'deep_lug');
    w2R.position.set(1.18, 0.52, -4.2);

    trolleyGroup.add(w1L, w1R, w2L, w2R);
    wheels.push(w1L, w1R, w2L, w2R);

    return { group: trolleyGroup, wheels, drawbarLength };

  } else if (type === 'tanker') {
    // ========================================================
    // 3. DAIRY & WATER TANKER (Purple & Silver Tanker like image 1)
    // ========================================================
    const drawbarLength = 3.0;

    // Eyelet at z = 0
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 16), chromeMat);
    eyelet.position.set(0, 0.55, 0);
    eyelet.rotation.x = Math.PI / 2;
    trolleyGroup.add(eyelet);

    // Drawbar
    const hitchPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), steelMat);
    hitchPole.position.set(0, 0.55, -0.7);
    hitchPole.rotation.x = Math.PI / 2;
    trolleyGroup.add(hitchPole);

    // Chassis frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 4.2), steelMat);
    frame.position.set(0, 0.85, -3.4);
    trolleyGroup.add(frame);

    // Tanker Body
    const tankTex = createTankerTexture();
    const tankMat = new THREE.MeshStandardMaterial({ map: tankTex, roughness: 0.4, metalness: 0.3 });
    const tankGeo = new THREE.CylinderGeometry(1.05, 1.05, 3.8, 24);
    tankGeo.rotateX(Math.PI / 2);
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(0, 1.85, -3.4);
    tank.castShadow = true;
    trolleyGroup.add(tank);

    // Front & rear rounded endcaps
    const capGeo = new THREE.SphereGeometry(1.05, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const capFront = new THREE.Mesh(capGeo, tankMat);
    capFront.position.set(0, 1.85, -1.5);
    capFront.rotation.x = Math.PI / 2;
    trolleyGroup.add(capFront);

    const capRear = new THREE.Mesh(capGeo, tankMat);
    capRear.position.set(0, 1.85, -5.3);
    capRear.rotation.x = -Math.PI / 2;
    trolleyGroup.add(capRear);

    // Top Dome & Valve
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 12), chromeMat);
    dome.position.set(0, 2.95, -3.2);
    trolleyGroup.add(dome);

    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8), chromeMat);
    valve.position.set(0, 1.15, -5.5);
    valve.rotation.x = Math.PI / 2;
    trolleyGroup.add(valve);

    // 4 Wheels
    const axleGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.1, 8);
    axleGeo.rotateZ(Math.PI / 2);
    const axle1 = new THREE.Mesh(axleGeo, steelMat);
    axle1.position.set(0, 0.52, -2.6);
    const axle2 = new THREE.Mesh(axleGeo, steelMat);
    axle2.position.set(0, 0.52, -4.2);
    trolleyGroup.add(axle1, axle2);

    const w1L = createAgriculturalTractorWheel(0.52, 0.32, false, 'red', 'deep_lug');
    w1L.position.set(-1.15, 0.52, -2.6);
    const w1R = createAgriculturalTractorWheel(0.52, 0.32, false, 'red', 'deep_lug');
    w1R.position.set(1.15, 0.52, -2.6);
    const w2L = createAgriculturalTractorWheel(0.52, 0.32, false, 'red', 'deep_lug');
    w2L.position.set(-1.15, 0.52, -4.2);
    const w2R = createAgriculturalTractorWheel(0.52, 0.32, false, 'red', 'deep_lug');
    w2R.position.set(1.15, 0.52, -4.2);

    trolleyGroup.add(w1L, w1R, w2L, w2R);
    wheels.push(w1L, w1R, w2L, w2R);

    return { group: trolleyGroup, wheels, drawbarLength };

  } else if (type === 'cultivator') {
    // ========================================================
    // 4. DELEKS SPRING CULTIVATOR / HAL (Mounted on 3-Point Linkage)
    // ========================================================
    const drawbarLength = 0.8; // Closely coupled to 3-point hitch

    // Red Heavy Steel Implement Frame (like image 1 & 3!)
    const redMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.5, metalness: 0.4 });
    const springMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.6, metalness: 0.7 });

    // Main transverse beam
    const mainBeam = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.16, 0.2), redMat);
    mainBeam.position.set(0, 0.65, -0.3);
    mainBeam.castShadow = true;
    trolleyGroup.add(mainBeam);

    // Upper A-Frame Mast for top link pin
    const mastL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.08), redMat);
    mastL.position.set(-0.25, 0.95, -0.3);
    mastL.rotation.z = -0.35;
    const mastR = mastL.clone();
    mastR.position.x = 0.25;
    mastR.rotation.z = 0.35;
    trolleyGroup.add(mastL, mastR);

    // DELEKS Brand Plate in center (like image 3!)
    const brandTex = createCultivatorBrandTexture();
    const brandMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.18), new THREE.MeshStandardMaterial({ map: brandTex }));
    brandMesh.position.set(0, 0.75, -0.41);
    brandMesh.rotation.y = Math.PI;
    trolleyGroup.add(brandMesh);

    // 9 Spring-Loaded Curved Cultivating Tines ("Hal" tines digging into dirt!)
    const tinePositions = [-1.05, -0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78, 1.05];
    tinePositions.forEach((tx) => {
      // Spring coil cushion on top
      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8), springMat);
      spring.position.set(tx, 0.68, -0.3);
      spring.rotation.x = Math.PI / 4;
      trolleyGroup.add(spring);

      // Curved steel shank shank
      const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8), steelMat);
      shank.position.set(tx, 0.32, -0.42);
      shank.rotation.x = -0.35;
      trolleyGroup.add(shank);

      // Chisel point duckfoot shovel tip (touches y = 0.04m near ground!)
      const point = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 4), chromeMat);
      point.position.set(tx, 0.06, -0.55);
      point.rotation.x = Math.PI / 2 + 0.4;
      trolleyGroup.add(point);
    });

    return { group: trolleyGroup, wheels: [], drawbarLength };
  }

  return { group: trolleyGroup, wheels: [], drawbarLength: 0 };
}

// Build Front Attachment (Dozer Loader Bucket, 500kg Weight Block, Bull-bar)
function buildFrontAttachment(type: FrontAttachment): THREE.Group {
  const attachGroup = new THREE.Group();
  attachGroup.name = `front_${type}`;

  const chassisMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.85, metalness: 0.4 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.15, metalness: 0.95 });

  if (type === 'dozer_bucket') {
    // ========================================================
    // 1. FRONT HEAVY-DUTY BLUE DOZER BUCKET (From Image 1!)
    // ========================================================
    const bucketTex = createDozerBucketTexture();
    const bucketMat = new THREE.MeshStandardMaterial({ map: bucketTex, roughness: 0.6, metalness: 0.35 });

    // Dual hydraulic lift arms extending forward from tractor frame
    for (let lx of [-0.62, 0.62]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 1.45), chassisMat);
      arm.position.set(lx, 0.72, 1.95);
      arm.rotation.x = -0.15;
      attachGroup.add(arm);

      // Chrome hydraulic ram cylinder
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 8), chromeMat);
      cyl.position.set(lx, 0.88, 1.75);
      cyl.rotation.x = -0.25;
      attachGroup.add(cyl);
    }

    // Wide loader scoop bucket (Deep blue shovel like image 1!)
    // Base scoop plate
    const scoopBase = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 0.95), bucketMat);
    scoopBase.position.set(0, 0.28, 2.85);
    scoopBase.rotation.x = 0.08;
    attachGroup.add(scoopBase);

    // Sloped back plate of bucket
    const scoopBack = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.75, 0.12), bucketMat);
    scoopBack.position.set(0, 0.65, 2.45);
    scoopBack.rotation.x = -0.35;
    attachGroup.add(scoopBack);

    // Left & Right side cutting plates
    for (let sx of [-1.16, 1.16]) {
      const sidePlate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.85), bucketMat);
      sidePlate.position.set(sx, 0.62, 2.75);
      attachGroup.add(sidePlate);
    }

    // Chisel cutting teeth along bottom lip
    for (let tx = -1.0; tx <= 1.0; tx += 0.25) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.18), chromeMat);
      tooth.position.set(tx, 0.24, 3.35);
      attachGroup.add(tooth);
    }

  } else if (type === 'heavy_bumper') {
    // ========================================================
    // 2. 500 KG CAST-IRON COUNTERWEIGHT BLOCK (From Image 5!)
    // ========================================================
    const weightBracket = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 0.5), chassisMat);
    weightBracket.position.set(0, 0.68, 2.15);
    attachGroup.add(weightBracket);

    const weightTex = createWeightBlockTexture();
    const weightBlockMat = new THREE.MeshStandardMaterial({ map: weightTex, roughness: 0.85, metalness: 0.35 });
    const weightBlock = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.52, 0.48), weightBlockMat);
    weightBlock.position.set(0, 0.8, 2.44);
    weightBlock.castShadow = true;
    attachGroup.add(weightBlock);

    // Heavy towing clevis pin
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 8), chromeMat);
    pin.position.set(0, 0.82, 2.7);
    attachGroup.add(pin);

  } else if (type === 'chrome_bullbar') {
    // ========================================================
    // 3. HEAVY TUBULAR CHROME BULLBAR
    // ========================================================
    const barMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.95, roughness: 0.15 });

    const lowerBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.1, 12), barMat);
    lowerBar.rotation.z = Math.PI / 2;
    lowerBar.position.set(0, 0.6, 2.3);
    attachGroup.add(lowerBar);

    const upperBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 12), barMat);
    upperBar.rotation.z = Math.PI / 2;
    upperBar.position.set(0, 1.15, 2.3);
    attachGroup.add(upperBar);

    for (let px of [-0.65, 0.65]) {
      const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 8), barMat);
      upright.position.set(px, 0.85, 2.3);
      attachGroup.add(upright);
    }
  }

  return attachGroup;
}

// Build Cabin / Roof & Punjabi DJ Sound System
function buildCabinStructure(
  style: CabinStyle,
  bodyColor: string,
  onSpeakerCreated?: (mesh: THREE.Mesh) => void
): THREE.Group {
  const cabGroup = new THREE.Group();
  cabGroup.name = `cabin_${style}`;

  const darkTrimMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8, metalness: 0.2 });
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: bodyColor, roughness: 0.25, metalness: 0.55 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.15, metalness: 0.95 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    roughness: 0.08,
    metalness: 0.1,
    transmission: 0.85,
    transparent: true,
    opacity: 0.88,
  });

  // Base platform floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.12, 1.75), darkTrimMat);
  floor.position.set(0, 1.15, -0.45);
  floor.castShadow = true;
  cabGroup.add(floor);

  // Anti-slip steps
  for (let side of [-1, 1]) {
    const stepLadder = new THREE.Group();
    stepLadder.position.set(side * 0.85, 0.7, -0.3);
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.32), darkTrimMat);
      step.position.set(side * (s * 0.06), -s * 0.18, 0);
      stepLadder.add(step);
    }
    cabGroup.add(stepLadder);
  }

  // Driver Seat & Steering
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.55), darkTrimMat);
  seatBase.position.set(0, 1.3, -0.65);
  cabGroup.add(seatBase);

  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.52), new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.9 }));
  seatCushion.position.set(0, 1.48, -0.63);
  cabGroup.add(seatCushion);

  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.65, 0.12), new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.9 }));
  seatBack.position.set(0, 1.85, -0.87);
  cabGroup.add(seatBack);

  // Steering Column & Tilt Wheel
  const steerCol = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.75, 8), darkTrimMat);
  steerCol.position.set(0, 1.55, -0.17);
  steerCol.rotation.x = -Math.PI / 5;
  cabGroup.add(steerCol);

  const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.026, 8, 16), darkTrimMat);
  steerWheel.position.set(0, 1.82, -0.33);
  steerWheel.rotation.x = -Math.PI / 3;
  cabGroup.add(steerWheel);

  // 3D Farmer Driver Character sitting in seat
  const driver = createFarmerDriver();
  driver.position.set(0, 1.48, -0.62);
  cabGroup.add(driver);

  // Digital Dashboard Screen
  const dashTex = createTractorDashboardTexture();
  const dashScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), new THREE.MeshBasicMaterial({ map: dashTex }));
  dashScreen.position.set(0, 1.68, -0.11);
  dashScreen.rotation.x = -Math.PI / 5;
  cabGroup.add(dashScreen);

  if (style === 'open_canopy_dj') {
    // ========================================================
    // 1. PUNJABI DJ SOUND SYSTEM CANOPY (From Image 1 & 5!)
    // ========================================================
    // 4 Heavy Tubular Steel Canopy Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.6 });
    for (let px of [-0.74, 0.74]) {
      for (let pz of [-1.15, 0.25]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.65, 8), pillarMat);
        pillar.position.set(px, 1.95, pz);
        cabGroup.add(pillar);
      }
    }

    // Overhead Sunshade Roof Canopy (Bright Red / Saffron body color with overhang like image 1 & 5!)
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 2.1), bodyMat);
    canopyRoof.position.set(0, 2.75, -0.45);
    canopyRoof.castShadow = true;
    cabGroup.add(canopyRoof);

    // Front Visor on Canopy
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.22, 0.1), bodyMat);
    visor.position.set(0, 2.65, 0.58);
    cabGroup.add(visor);

    // GIANT DJ SOUND SYSTEM BOX (Wall of Subwoofers mounted under roof canopy like image 1 & 5!)
    const djBoxTex = createDJSpeakerTexture();
    const djMat = new THREE.MeshStandardMaterial({ map: djBoxTex, roughness: 0.7 });

    // Front-facing DJ Speaker Box
    const speakerFront = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.65, 0.45), djMat);
    speakerFront.position.set(0, 2.38, 0.25);
    cabGroup.add(speakerFront);
    if (onSpeakerCreated) onSpeakerCreated(speakerFront);

    // Rear-facing DJ Speaker Box (Blast bass to the village behind!)
    const speakerRear = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.65, 0.45), djMat);
    speakerRear.position.set(0, 2.38, -1.05);
    cabGroup.add(speakerRear);
    if (onSpeakerCreated) onSpeakerCreated(speakerRear);

    // 4 Overhead Strobe / Laser Beacon Lights (Pulsing colors!)
    const beaconGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10);
    const beaconMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#f97316', emissiveIntensity: 1.2 });
    for (let bx of [-0.68, -0.22, 0.22, 0.68]) {
      const b = new THREE.Mesh(beaconGeo, beaconMat);
      b.position.set(bx, 2.86, 0.52);
      cabGroup.add(b);
    }

  } else if (style === 'enclosed_glass') {
    // ========================================================
    // 2. ENCLOSED MODERN GLASS CABIN (ROPS Cab with 6 Pillars)
    // ========================================================
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.6 });
    const pillarPositions = [
      { x: -0.68, z: 0.27, h: 1.45, angleZ: -0.06, angleX: 0.08 },
      { x: 0.68, z: 0.27, h: 1.45, angleZ: 0.06, angleX: 0.08 },
      { x: -0.74, z: -0.5, h: 1.45, angleZ: -0.03, angleX: 0 },
      { x: 0.74, z: -0.5, h: 1.45, angleZ: 0.03, angleX: 0 },
      { x: -0.72, z: -1.2, h: 1.45, angleZ: -0.04, angleX: -0.06 },
      { x: 0.72, z: -1.2, h: 1.45, angleZ: 0.04, angleX: -0.06 },
    ];

    pillarPositions.forEach((pp) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, pp.h, 8), pillarMat);
      p.position.set(pp.x, 1.88, pp.z);
      p.rotation.set(pp.angleX, 0, pp.angleZ);
      cabGroup.add(p);
    });

    // Panoramic Windshield
    const wind = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.35), glassMat);
    wind.position.set(0, 1.9, 0.27);
    wind.rotation.x = 0.08;
    cabGroup.add(wind);

    // Rear Window
    const rearWin = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.35), glassMat);
    rearWin.position.set(0, 1.9, -1.19);
    rearWin.rotation.y = Math.PI;
    cabGroup.add(rearWin);

    // Doors
    const doorL = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.32), glassMat);
    doorL.position.set(-0.73, 1.9, -0.47);
    doorL.rotation.y = -Math.PI / 2;
    const doorR = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.32), glassMat);
    doorR.position.set(0.73, 1.9, -0.47);
    doorR.rotation.y = Math.PI / 2;
    cabGroup.add(doorL, doorR);

    // Molded Insulated Cabin Roof
    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.22, 1.95), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 }));
    cabRoof.position.set(0, 2.65, -0.43);
    cabRoof.castShadow = true;
    cabGroup.add(cabRoof);

    // Work lights on roof
    const workLightMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f8fafc', emissiveIntensity: 0.8 });
    for (let lx of [-0.62, -0.28, 0.28, 0.62]) {
      const wl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.08), workLightMat);
      wl.position.set(lx, 2.62, 0.57);
      cabGroup.add(wl);
    }

  } else if (style === 'open_rollbar') {
    // ========================================================
    // 3. OPEN ROLLBAR (Classic Village Look)
    // ========================================================
    const barMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.6 });
    for (let px of [-0.72, 0.72]) {
      const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), barMat);
      upright.position.set(px, 1.9, -0.9);
      cabGroup.add(upright);
    }
    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), barMat);
    topBar.position.set(0, 2.68, -0.9);
    topBar.rotation.z = Math.PI / 2;
    cabGroup.add(topBar);

  } else if (style === 'sunshade_flat') {
    // ========================================================
    // 4. TRADITIONAL CANVAS FLAT SUNSHADE
    // ========================================================
    const pipeMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.6 });
    for (let px of [-0.68, 0.68]) {
      const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), pipeMat);
      upright.position.set(px, 1.85, -0.95);
      cabGroup.add(upright);
    }
    const shadeMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.9 });
    const shade = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.8), shadeMat);
    shade.position.set(0, 2.58, -0.45);
    cabGroup.add(shade);
  }

  return cabGroup;
}

// Build Tractor Silencer / Exhaust Chimney Stack
function buildSilencer(style: SilencerStyle): { group: THREE.Group; tipPos: THREE.Vector3 } {
  const group = new THREE.Group();
  group.name = `silencer_${style}`;

  const chromeMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.95, roughness: 0.15 });
  const blackPipeMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.7, metalness: 0.4 });

  let tipPos = new THREE.Vector3(0.55, 3.05, 0.75);

  // Manifold bracket
  const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 8), blackPipeMat);
  manifold.position.set(0.48, 1.15, 0.85);
  manifold.rotation.z = Math.PI / 4;
  group.add(manifold);

  if (style === 'punjab_flapper') {
    // High vertical stack with rain flapper cap (from image 1 & 5!)
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 1.75, 12), blackPipeMat);
    pipe.position.set(0.55, 2.08, 0.75);
    group.add(pipe);

    // Chrome heat shield
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.8, 12), chromeMat);
    shield.position.set(0.55, 1.85, 0.75);
    group.add(shield);

    // Flapper rain cap
    const flapper = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 0.09), chromeMat);
    flapper.position.set(0.55, 2.98, 0.75);
    flapper.rotation.z = 0.28; // flipped open by exhaust flow
    group.add(flapper);

    tipPos.set(0.55, 3.05, 0.75);

  } else if (style === 'straight_chrome') {
    // Tall gleaming straight chrome pipe (from image 4!)
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 1.9, 12), chromeMat);
    pipe.position.set(0.55, 2.15, 0.75);
    group.add(pipe);

    // Flared trumpet exhaust tip
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.18, 12), chromeMat);
    tip.position.set(0.55, 3.12, 0.75);
    group.add(tip);

    tipPos.set(0.55, 3.2, 0.75);

  } else if (style === 'curved') {
    // Curved side pipe
    const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 10), blackPipeMat);
    pipe1.position.set(0.55, 1.8, 0.75);
    group.add(pipe1);

    const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10), blackPipeMat);
    pipe2.position.set(0.7, 2.45, 0.75);
    pipe2.rotation.z = -Math.PI / 4;
    group.add(pipe2);

    tipPos.set(0.85, 2.65, 0.75);
  }

  return { group, tipPos };
}

// Main Vehicle Rig Builder
export function buildVehicleRig(
  config: VehicleConfig,
  customColor?: string,
  tractorMods?: TractorModSettings
): VehicleRig {
  const root = new THREE.Group();
  root.name = `vehicle_${config.id}`;

  const frontWheels: THREE.Object3D[] = [];
  const rearWheels: THREE.Object3D[] = [];
  const allWheels: THREE.Object3D[] = [];
  const headlightMeshes: THREE.Mesh[] = [];
  const brakeLightMeshes: THREE.Mesh[] = [];
  const headlightLights: THREE.SpotLight[] = [];
  let exhaustPos = new THREE.Vector3(0, 0.4, -config.length / 2);

  let trolleyGroup: THREE.Group | undefined;
  let trolleyWheels: THREE.Object3D[] | undefined;
  let trolleyHeading: number | undefined = 0;
  let trolleyType: TrolleyType | undefined = tractorMods?.trolleyType ?? (config.isTractor ? 'grain_trolley' : 'none');
  let trolleyHitchOffset: number | undefined = -2.1;
  let trolleyDrawbarLength: number | undefined = 2.6;

  const speakerMeshes: THREE.Mesh[] = [];
  let dozerGroup: THREE.Group | undefined;
  let silencerGroup: THREE.Group | undefined;
  let cabinGroup: THREE.Group | undefined;
  let activeMods: TractorModSettings = tractorMods ? { ...tractorMods } : { ...DEFAULT_TRACTOR_MODS };

  const primaryColor = customColor || config.color;

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: primaryColor,
    roughness: 0.25,
    metalness: 0.55,
    clearcoat: 0.45,
    clearcoatRoughness: 0.15,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    roughness: 0.15,
    metalness: 0.95,
  });

  const darkTrimMaterial = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.8,
    metalness: 0.2,
  });

  let primaryBodyMesh: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), bodyMaterial);

  // BUILD TRACTOR MODELS OR OTHER VEHICLES
  if (config.isTractor) {
    // ========================================================
    // AUTHENTIC INDIAN TRACTOR ARCHITECTURE
    // ========================================================

    // Heavy structural chassis frame
    const chassisGeo = new THREE.BoxGeometry(1.2, 0.45, 3.8);
    const chassisMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.85, metalness: 0.4 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.set(0, 0.65, 0.15);
    chassis.castShadow = true;
    root.add(chassis);

    // Front axle beam
    const frontAxleGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.6, 8);
    frontAxleGeo.rotateZ(Math.PI / 2);
    const frontAxle = new THREE.Mesh(frontAxleGeo, chassisMat);
    frontAxle.position.set(0, 0.56, 1.45);
    root.add(frontAxle);

    // Rear axle trumpets
    const rearAxleGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.85, 10);
    rearAxleGeo.rotateZ(Math.PI / 2);
    const rearAxle = new THREE.Mesh(rearAxleGeo, chassisMat);
    rearAxle.position.set(0, 0.96, -0.95);
    root.add(rearAxle);

    // Sculpted Engine Hood
    const hoodGeo = new THREE.BoxGeometry(1.18, 0.78, 2.15);
    const hood = new THREE.Mesh(hoodGeo, bodyMaterial);
    hood.position.set(0, 1.25, 0.65);
    hood.castShadow = true;
    root.add(hood);
    primaryBodyMesh = hood;

    // Nose Cone
    const noseGeo = new THREE.BoxGeometry(1.12, 0.68, 0.4);
    const nose = new THREE.Mesh(noseGeo, bodyMaterial);
    nose.position.set(0, 1.18, 1.82);
    nose.castShadow = true;
    root.add(nose);

    // Front Radiator Grille
    const grilleTex = createTractorGrilleTexture();
    const grilleMat = new THREE.MeshStandardMaterial({ map: grilleTex, roughness: 0.7 });
    const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.58), grilleMat);
    grille.position.set(0, 1.18, 2.03);
    root.add(grille);

    // Chrome Grille Trim Bezel
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.64, 0.04), chromeMaterial);
    bezel.position.set(0, 1.18, 2.01);
    root.add(bezel);

    // Dual High-Intensity Headlights
    const hlLensGeo = new THREE.BoxGeometry(0.24, 0.16, 0.08);
    const hlLensMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#fef08a',
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const hlL = new THREE.Mesh(hlLensGeo, hlLensMat);
    hlL.position.set(-0.36, 1.22, 2.02);
    const hlR = hlL.clone();
    hlR.position.set(0.36, 1.22, 2.02);
    root.add(hlL, hlR);
    headlightMeshes.push(hlL, hlR);

    // Rear Fenders (Wrapping over large agricultural tires)
    const fenderGeo = new THREE.BoxGeometry(0.58, 0.72, 1.75);
    const leftFender = new THREE.Mesh(fenderGeo, bodyMaterial);
    leftFender.position.set(-1.05, 1.62, -0.95);
    leftFender.castShadow = true;
    root.add(leftFender);

    const rightFender = leftFender.clone();
    rightFender.position.set(1.05, 1.62, -0.95);
    root.add(rightFender);

    // Rear Brake Lamps
    const rearLampGeo = new THREE.BoxGeometry(0.18, 0.28, 0.08);
    const rearLampMat = new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.35 });
    const rlL = new THREE.Mesh(rearLampGeo, rearLampMat);
    rlL.position.set(-1.08, 1.65, -1.82);
    const rlR = rlL.clone();
    rlR.position.set(1.08, 1.65, -1.82);
    root.add(rlL, rlR);
    brakeLightMeshes.push(rlL, rlR);

    // Rear 3-Point Linkage & Hitch Clevis Pin
    const hitchGroup = new THREE.Group();
    hitchGroup.position.set(0, 0.55, -1.85);

    for (let lx of [-0.35, 0.35]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.65), darkTrimMaterial);
      arm.position.set(lx, 0.15, -0.25);
      hitchGroup.add(arm);
    }

    const topLink = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8), darkTrimMaterial);
    topLink.position.set(0, 0.45, -0.2);
    topLink.rotation.x = Math.PI / 4;
    hitchGroup.add(topLink);

    // Heavy Hitch Clevis Pin (Trolley hitch point)
    const hitchPin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.28, 8), chromeMaterial);
    hitchPin.position.set(0, 0.15, -0.55);
    hitchGroup.add(hitchPin);

    root.add(hitchGroup);

    // Front Attachment (Dozer Loader Bucket, 500kg Bumper, Bullbar)
    dozerGroup = buildFrontAttachment(activeMods.frontAttachment);
    root.add(dozerGroup);

    // Cabin / Roof Structure (Open DJ Canopy, Enclosed Glass, Rollbar)
    cabinGroup = buildCabinStructure(activeMods.cabinStyle, primaryColor, (spk) => {
      speakerMeshes.push(spk);
    });
    root.add(cabinGroup);

    // Silencer Stack
    const silencerData = buildSilencer(activeMods.silencerStyle);
    silencerGroup = silencerData.group;
    exhaustPos = silencerData.tipPos;
    root.add(silencerGroup);

    // HUGE AGRICULTURAL WHEELS (TOUCHING Y = 0.00m)
    const rimCol = activeMods.rimColor;
    const tyreSty = activeMods.tyreStyle;

    const wFL = createAgriculturalTractorWheel(0.56, 0.34, false, rimCol, tyreSty);
    wFL.position.set(-0.88, 0.56, 1.45);
    const wFR = createAgriculturalTractorWheel(0.56, 0.34, false, rimCol, tyreSty);
    wFR.position.set(0.88, 0.56, 1.45);
    frontWheels.push(wFL, wFR);

    const wRL = createAgriculturalTractorWheel(0.96, 0.52, true, rimCol, tyreSty);
    wRL.position.set(-1.02, 0.96, -0.95);
    const wRR = createAgriculturalTractorWheel(0.96, 0.52, true, rimCol, tyreSty);
    wRR.position.set(1.02, 0.96, -0.95);
    rearWheels.push(wRL, wRR);

    // TROLLEY / IMPLEMENT ATTACHMENT
    if (activeMods.trolleyType !== 'none') {
      const trolleyData = buildTrolleyMesh(activeMods.trolleyType, rimCol);
      trolleyGroup = trolleyData.group;
      trolleyWheels = trolleyData.wheels;
      trolleyDrawbarLength = trolleyData.drawbarLength;
      trolleyHitchOffset = -2.4; // 2.4m behind tractor origin

      // Initial placement behind tractor
      trolleyGroup.position.set(0, 0, -2.4 - trolleyDrawbarLength);
      root.add(trolleyGroup);
    }

  } else if (config.id === 'hatchback') {
    // 2. HATCHBACK
    const bodyGeo = new THREE.BoxGeometry(1.65, 0.65, 3.6);
    const body = new THREE.Mesh(bodyGeo, bodyMaterial);
    body.position.set(0, 0.55, 0);
    body.castShadow = true;
    root.add(body);
    primaryBodyMesh = body;

    const cabinGeo = new THREE.BoxGeometry(1.4, 0.6, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
    cabin.position.set(0, 1.1, -0.2);
    root.add(cabin);

    const wFL = createWheel(0.35, 0.22);
    wFL.position.set(-0.85, 0.35, 1.05);
    const wFR = createWheel(0.35, 0.22);
    wFR.position.set(0.85, 0.35, 1.05);
    frontWheels.push(wFL, wFR);

    const wRL = createWheel(0.35, 0.22);
    wRL.position.set(-0.85, 0.35, -1.05);
    const wRR = createWheel(0.35, 0.22);
    wRR.position.set(0.85, 0.35, -1.05);
    rearWheels.push(wRL, wRR);

    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.4 }));
    hlL.position.set(-0.55, 0.65, 1.82);
    const hlR = hlL.clone();
    hlR.position.set(0.55, 0.65, 1.82);
    root.add(hlL, hlR);
    headlightMeshes.push(hlL, hlR);

    const rlL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.1), new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.3 }));
    rlL.position.set(-0.58, 0.65, -1.82);
    const rlR = rlL.clone();
    rlR.position.set(0.58, 0.65, -1.82);
    root.add(rlL, rlR);
    brakeLightMeshes.push(rlL, rlR);

  } else if (config.id === 'sedan') {
    // 3. SEDAN
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.58, 4.4), bodyMaterial);
    body.position.set(0, 0.52, 0);
    body.castShadow = true;
    root.add(body);
    primaryBodyMesh = body;

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.56, 2.3), bodyMaterial);
    cabin.position.set(0, 1.05, -0.15);
    root.add(cabin);

    const wFL = createWheel(0.38, 0.24);
    wFL.position.set(-0.9, 0.38, 1.3);
    const wFR = createWheel(0.38, 0.24);
    wFR.position.set(0.9, 0.38, 1.3);
    frontWheels.push(wFL, wFR);

    const wRL = createWheel(0.38, 0.24);
    wRL.position.set(-0.9, 0.38, -1.3);
    const wRR = createWheel(0.38, 0.24);
    wRR.position.set(0.9, 0.38, -1.3);
    rearWheels.push(wRL, wRR);

    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.1), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.5 }));
    hlL.position.set(-0.6, 0.6, 2.21);
    const hlR = hlL.clone();
    hlR.position.set(0.6, 0.6, 2.21);
    root.add(hlL, hlR);
    headlightMeshes.push(hlL, hlR);

    const rlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.1), new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.3 }));
    rlL.position.set(-0.6, 0.6, -2.21);
    const rlR = rlL.clone();
    rlR.position.set(0.6, 0.6, -2.21);
    root.add(rlL, rlR);
    brakeLightMeshes.push(rlL, rlR);

  } else if (config.id === 'suv') {
    // 4. SUV (Mahindra Thar / 4x4 style)
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.8, 4.0), bodyMaterial);
    body.position.set(0, 0.75, 0);
    body.castShadow = true;
    root.add(body);
    primaryBodyMesh = body;

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 2.4), bodyMaterial);
    cabin.position.set(0, 1.5, -0.4);
    root.add(cabin);

    const wFL = createWheel(0.46, 0.28);
    wFL.position.set(-0.95, 0.46, 1.25);
    const wFR = createWheel(0.46, 0.28);
    wFR.position.set(0.95, 0.46, 1.25);
    frontWheels.push(wFL, wFR);

    const wRL = createWheel(0.46, 0.28);
    wRL.position.set(-0.95, 0.46, -1.25);
    const wRR = createWheel(0.46, 0.28);
    wRR.position.set(0.95, 0.46, -1.25);
    rearWheels.push(wRL, wRR);

    const hlL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.5 }));
    hlL.rotateX(Math.PI / 2);
    hlL.position.set(-0.65, 0.85, 2.02);
    const hlR = hlL.clone();
    hlR.position.set(0.65, 0.85, 2.02);
    root.add(hlL, hlR);
    headlightMeshes.push(hlL, hlR);

    const rlL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.3 }));
    rlL.position.set(-0.75, 0.9, -2.02);
    const rlR = rlL.clone();
    rlR.position.set(0.75, 0.9, -2.02);
    root.add(rlL, rlR);
    brakeLightMeshes.push(rlL, rlR);

  } else if (config.id === 'sports') {
    // 5. SPORTS CAR
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 4.4), bodyMaterial);
    body.position.set(0, 0.4, 0);
    body.castShadow = true;
    root.add(body);
    primaryBodyMesh = body;

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 1.8), bodyMaterial);
    cabin.position.set(0, 0.78, -0.2);
    root.add(cabin);

    const wFL = createWheel(0.36, 0.26);
    wFL.position.set(-0.95, 0.36, 1.35);
    const wFR = createWheel(0.36, 0.26);
    wFR.position.set(0.95, 0.36, 1.35);
    frontWheels.push(wFL, wFR);

    const wRL = createWheel(0.38, 0.3);
    wRL.position.set(-0.98, 0.38, -1.25);
    const wRR = createWheel(0.38, 0.3);
    wRR.position.set(0.98, 0.38, -1.25);
    rearWheels.push(wRL, wRR);

    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.15), new THREE.MeshStandardMaterial({ color: '#e0f2fe', emissive: '#38bdf8', emissiveIntensity: 0.8 }));
    hlL.position.set(-0.65, 0.48, 2.18);
    const hlR = hlL.clone();
    hlR.position.set(0.65, 0.48, 2.18);
    root.add(hlL, hlR);
    headlightMeshes.push(hlL, hlR);

    const rlL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.1), new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#b91c1c', emissiveIntensity: 0.6 }));
    rlL.position.set(-0.55, 0.52, -2.2);
    const rlR = rlL.clone();
    rlR.position.set(0.55, 0.52, -2.2);
    root.add(rlL, rlR);
    brakeLightMeshes.push(rlL, rlR);

  } else if (config.id === 'motorcycle') {
    // 6. MOTORCYCLE
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 1.2), darkTrimMaterial);
    frame.position.set(0, 0.5, 0);
    root.add(frame);
    primaryBodyMesh = frame;

    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.65), bodyMaterial);
    tank.position.set(0, 0.78, 0.18);
    root.add(tank);

    const wF = createWheel(0.38, 0.14);
    wF.position.set(0, 0.38, 0.85);
    frontWheels.push(wF);

    const wR = createWheel(0.38, 0.16);
    wR.position.set(0, 0.38, -0.75);
    rearWheels.push(wR);

    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 0.5 }));
    hl.rotateX(Math.PI / 2);
    hl.position.set(0, 0.88, 0.85);
    root.add(hl);
    headlightMeshes.push(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.4 }));
    tl.position.set(0, 0.65, -0.92);
    root.add(tl);
    brakeLightMeshes.push(tl);

  } else if (config.id === 'truck') {
    // 7. INDIAN DELIVERY TRUCK
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.8), bodyMaterial);
    cabin.position.set(0, 1.5, 1.8);
    cabin.castShadow = true;
    root.add(cabin);
    primaryBodyMesh = cabin;

    // Tailgate with HORN OK PLEASE
    const tailTex = createTruckTailgateTexture();
    const tailMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.16, 1.1), new THREE.MeshStandardMaterial({ map: tailTex, roughness: 0.8 }));
    tailMesh.position.set(0, 1.55, -2.81);
    tailMesh.rotation.y = Math.PI;
    root.add(tailMesh);

    const wFL = createWheel(0.52, 0.3);
    wFL.position.set(-1.1, 0.52, 1.8);
    const wFR = createWheel(0.52, 0.3);
    wFR.position.set(1.1, 0.52, 1.8);
    frontWheels.push(wFL, wFR);

    const wRL1 = createWheel(0.52, 0.45);
    wRL1.position.set(-1.15, 0.52, -0.6);
    const wRR1 = createWheel(0.52, 0.45);
    wRR1.position.set(1.15, 0.52, -0.6);
    const wRL2 = createWheel(0.52, 0.45);
    wRL2.position.set(-1.15, 0.52, -1.8);
    const wRR2 = createWheel(0.52, 0.45);
    wRR2.position.set(1.15, 0.52, -1.8);
    rearWheels.push(wRL1, wRR1, wRL2, wRR2);

    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 0.4 }));
    hlL.position.set(-0.75, 0.65, 2.85);
    const hlR = hlL.clone();
    hlR.position.set(0.75, 0.65, 2.85);
    root.add(hlL, hlR);
    headlightMeshes.push(hlL, hlR);

    const rlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.4 }));
    rlL.position.set(-0.85, 0.7, -2.85);
    const rlR = rlL.clone();
    rlR.position.set(0.85, 0.7, -2.85);
    root.add(rlL, rlR);
    brakeLightMeshes.push(rlL, rlR);
  }

  // Add wheels to root
  [...frontWheels, ...rearWheels].forEach((w) => {
    root.add(w);
    allWheels.push(w);
  });

  // Spotlight cones for night driving
  const spotL = new THREE.SpotLight(0xffffff, 0, 45, Math.PI / 6, 0.4, 1.5);
  spotL.position.set(-0.5, 0.8, config.length / 2);
  const targetL = new THREE.Object3D();
  targetL.position.set(-0.5, 0, config.length / 2 + 25);
  root.add(spotL);
  root.add(targetL);
  spotL.target = targetL;

  const spotR = new THREE.SpotLight(0xffffff, 0, 45, Math.PI / 6, 0.4, 1.5);
  spotR.position.set(0.5, 0.8, config.length / 2);
  const targetR = new THREE.Object3D();
  targetR.position.set(0.5, 0, config.length / 2 + 25);
  root.add(spotR);
  root.add(targetR);
  spotR.target = targetR;

  headlightLights.push(spotL, spotR);

  // Contact shadow disk directly beneath the chassis
  const shadowGeo = new THREE.PlaneGeometry(config.width * 1.35, config.length * 1.15);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 15, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.65)');
  grad.addColorStop(0.7, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.03;
  root.add(shadowPlane);

  const rig: VehicleRig = {
    group: root,
    config,
    frontWheels,
    rearWheels,
    allWheels,
    bodyMesh: primaryBodyMesh,
    headlightMeshes,
    brakeLightMeshes,
    headlightLights,
    exhaustPos,
    trolleyGroup,
    trolleyWheels,
    trolleyHeading,
    trolleyType,
    trolleyHitchOffset,
    trolleyDrawbarLength,
    speakerMeshes,
    dozerGroup,
    activeMods,
    setBraking: (braking: boolean) => {
      brakeLightMeshes.forEach((m) => {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.emissive.set(braking ? '#ef4444' : '#7f1d1d');
        mat.emissiveIntensity = braking ? 1.5 : 0.3;
      });
    },
    setHeadlights: (on: boolean) => {
      headlightMeshes.forEach((m) => {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = on ? 1.8 : 0.3;
      });
      headlightLights.forEach((light) => {
        light.intensity = on ? 35 : 0;
      });
    },
    updateColor: (newColor: string) => {
      (primaryBodyMesh.material as THREE.MeshPhysicalMaterial).color.set(newColor);
    },
  };

  // Live modification update method
  rig.updateModifications = (newMods: TractorModSettings) => {
    rig.activeMods = { ...newMods };
    rig.trolleyType = newMods.trolleyType;

    // Remove old trolley if any
    if (rig.trolleyGroup) {
      root.remove(rig.trolleyGroup);
      rig.trolleyGroup = undefined;
      rig.trolleyWheels = undefined;
    }

    // Add new trolley if requested
    if (newMods.trolleyType !== 'none') {
      const tData = buildTrolleyMesh(newMods.trolleyType, newMods.rimColor);
      rig.trolleyGroup = tData.group;
      rig.trolleyWheels = tData.wheels;
      rig.trolleyDrawbarLength = tData.drawbarLength;
      rig.trolleyHitchOffset = -2.4;
      rig.trolleyGroup.position.set(0, 0, -2.4 - tData.drawbarLength);
      root.add(rig.trolleyGroup);
    }

    // Replace front attachment if tractor
    if (config.isTractor && dozerGroup) {
      root.remove(dozerGroup);
      dozerGroup = buildFrontAttachment(newMods.frontAttachment);
      rig.dozerGroup = dozerGroup;
      root.add(dozerGroup);
    }

    // Replace cabin structure if tractor
    if (config.isTractor && cabinGroup) {
      root.remove(cabinGroup);
      speakerMeshes.length = 0;
      cabinGroup = buildCabinStructure(newMods.cabinStyle, (primaryBodyMesh.material as THREE.MeshPhysicalMaterial).color.getHexString(), (spk) => {
        speakerMeshes.push(spk);
      });
      root.add(cabinGroup);
    }
  };

  return rig;
}
