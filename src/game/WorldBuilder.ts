/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Landmark } from '../types/game';
import {
  createHighwayRoadTexture,
  createVillagePathTexture,
  createBrickTexture,
  createTollSignTexture,
  createVillageArchTexture,
  createDhabaSignTexture,
  createPetrolSignTexture,
  createAirportSignTexture,
  createMustardCropTexture,
  createRunwayTexture,
  createCityWelcomeTexture,
  createHighwayDirectionTexture,
} from './proceduralTextures';

export interface CollisionBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
  radius: number;
  type: string;
}

export interface TollGateState {
  barrierL: THREE.Object3D;
  barrierR: THREE.Object3D;
  pos: THREE.Vector3;
  width: number;
  openAngle: number;
  currentAngle: number;
  isOpen: boolean;
  isVehicleInside: boolean;
}

export interface WorldData {
  root: THREE.Group;
  collisionBoxes: CollisionBox[];
  landmarks: Landmark[];
  tollGate: TollGateState;
  trafficLights: THREE.Object3D[];
  pedestrians: { mesh: THREE.Group; pos: THREE.Vector3; dir: THREE.Vector3; speed: number; waypoints: THREE.Vector3[]; wpIndex: number }[];
  update: (delta: number) => void;
  getTerrainHeight: (x: number, z: number) => number;
}

export function buildOpenWorld(): WorldData {
  const root = new THREE.Group();
  root.name = 'OpenWorld_Root';

  const collisionBoxes: CollisionBox[] = [];
  const trafficLights: THREE.Object3D[] = [];
  const pedestrians: WorldData['pedestrians'] = [];

  const landmarks: Landmark[] = [
    { id: 'village', name: 'Rampur Village (रामपुर)', type: 'village', pos: [-240, -220], color: '#f59e0b' },
    { id: 'field', name: 'Rampur Farm Field (खेत)', type: 'farm', pos: [-210, -100], color: '#84cc16' },
    { id: 'temple', name: 'Shri Ram Mandir (मंदिर)', type: 'temple', pos: [-290, -280], color: '#f97316' },
    { id: 'dhaba', name: 'Sher-e-Punjab Dhaba', type: 'village', pos: [-120, -110], color: '#ef4444' },
    { id: 'toll', name: 'NH-44 Toll Plaza (टोल)', type: 'toll', pos: [-20, -10], color: '#10b981' },
    { id: 'fuel', name: 'Indian Oil Petrol Station', type: 'fuel', pos: [80, 70], color: '#3b82f6' },
    { id: 'city', name: 'Metro City Center (शहर)', type: 'city', pos: [260, 220], color: '#8b5cf6' },
    { id: 'airport', name: 'Bharatpur Airport (हवाई अड्डा)', type: 'airport', pos: [-220, 260], color: '#06b6d4' },
  ];

  function addObstacle(center: THREE.Vector3, size: THREE.Vector3, type: string) {
    collisionBoxes.push({
      min: new THREE.Vector3(center.x - size.x / 2, center.y - size.y / 2, center.z - size.z / 2),
      max: new THREE.Vector3(center.x + size.x / 2, center.y + size.y / 2, center.z + size.z / 2),
      center: center.clone(),
      radius: Math.max(size.x, size.z) / 2,
      type,
    });
  }

  // Terrain height function: subtle rolling hills with flat road paths
  function getTerrainHeight(x: number, z: number): number {
    // Keep roads and main zones flat for smooth driving
    const distToCenter = Math.hypot(x, z);
    if (distToCenter < 400) return 0;
    // Perimeter gentle hills
    const hill = Math.sin(x * 0.008) * Math.cos(z * 0.008) * 4.0;
    return Math.max(0, hill);
  }

  // 1. TERRAIN BASE (1200 x 1200m)
  const terrainGeo = new THREE.PlaneGeometry(1300, 1300, 48, 48);
  terrainGeo.rotateX(-Math.PI / 2);

  // Deform perimeter vertices gently
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, getTerrainHeight(vx, vz));
  }
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    color: '#60793b', // Warm green Indian countryside grass
    roughness: 0.95,
    metalness: 0.05,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.receiveShadow = true;
  root.add(terrain);

  // River / Canal cutting through landscape
  const riverGeo = new THREE.PlaneGeometry(1300, 40);
  riverGeo.rotateX(-Math.PI / 2);
  const riverMat = new THREE.MeshPhysicalMaterial({
    color: '#1e3a5f',
    roughness: 0.1,
    metalness: 0.4,
    transmission: 0.6,
    transparent: true,
    opacity: 0.88,
  });
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.position.set(0, -0.4, 0);
  river.rotation.y = -Math.PI / 4;
  root.add(river);

  // 2. CONNECTED ROAD NETWORK
  const roadMat = new THREE.MeshStandardMaterial({
    map: createHighwayRoadTexture(),
    roughness: 0.85,
  });
  roadMat.map!.repeat.set(1, 40);

  const dirtRoadMat = new THREE.MeshStandardMaterial({
    map: createVillagePathTexture(),
    roughness: 0.95,
  });
  dirtRoadMat.map!.repeat.set(1, 25);

  // Main NH-44 Highway (diagonal artery connecting Village to City)
  const highwayGeo = new THREE.PlaneGeometry(24, 750);
  highwayGeo.rotateX(-Math.PI / 2);
  const highway = new THREE.Mesh(highwayGeo, roadMat);
  highway.position.set(0, 0.04, 0);
  highway.rotation.y = Math.PI / 4;
  highway.receiveShadow = true;
  root.add(highway);

  // Highway Bridge over River
  const bridgeDeckGeo = new THREE.BoxGeometry(26, 1.2, 80);
  const concreteMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.8 });
  const bridgeDeck = new THREE.Mesh(bridgeDeckGeo, concreteMat);
  bridgeDeck.position.set(0, 0.6, 0);
  bridgeDeck.rotation.y = Math.PI / 4;
  bridgeDeck.castShadow = true;
  bridgeDeck.receiveShadow = true;
  root.add(bridgeDeck);

  // Bridge Arches & Railings
  const railingGeo = new THREE.BoxGeometry(0.8, 1.4, 80);
  const railL = new THREE.Mesh(railingGeo, concreteMat);
  railL.position.set(-13, 1.2, 0);
  const railR = railL.clone();
  railR.position.set(13, 1.2, 0);
  bridgeDeck.add(railL, railR);
  addObstacle(new THREE.Vector3(-10, 1.2, 0), new THREE.Vector3(2, 2, 80), 'bridge_rail');
  addObstacle(new THREE.Vector3(10, 1.2, 0), new THREE.Vector3(2, 2, 80), 'bridge_rail');

  // Highway Median Barrier & Streetlights
  for (let d = -320; d <= 320; d += 45) {
    if (Math.abs(d) < 35) continue; // skip bridge center & toll
    const polePos = new THREE.Vector3(d * 0.707, 0, d * 0.707);
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 8, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.8, roughness: 0.3 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(polePos.x, 4, polePos.z);
    pole.castShadow = true;
    root.add(pole);

    // Lamp heads
    const lampGeo = new THREE.BoxGeometry(1.6, 0.25, 0.5);
    const lampMat = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 0.5 });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(polePos.x, 8, polePos.z);
    lamp.rotation.y = Math.PI / 4;
    root.add(lamp);
  }

  // Village Roads (Dirt paths winding into the village fields)
  const villageRoadGeo1 = new THREE.PlaneGeometry(14, 380);
  villageRoadGeo1.rotateX(-Math.PI / 2);
  const villageRoad1 = new THREE.Mesh(villageRoadGeo1, dirtRoadMat);
  villageRoad1.position.set(-240, 0.05, -220);
  villageRoad1.receiveShadow = true;
  root.add(villageRoad1);

  const villageRoadGeo2 = new THREE.PlaneGeometry(12, 280);
  villageRoadGeo2.rotateX(-Math.PI / 2);
  const villageRoad2 = new THREE.Mesh(villageRoadGeo2, dirtRoadMat);
  villageRoad2.position.set(-200, 0.05, -180);
  villageRoad2.rotation.y = Math.PI / 2;
  villageRoad2.receiveShadow = true;
  root.add(villageRoad2);

  // Farm Field Access Road (connecting Village Chowk directly to Rampur Plowing Farm Field)
  const farmRoadGeo = new THREE.PlaneGeometry(13, 140);
  farmRoadGeo.rotateX(-Math.PI / 2);
  const farmRoad = new THREE.Mesh(farmRoadGeo, dirtRoadMat);
  farmRoad.position.set(-218, 0.05, -145);
  farmRoad.rotation.y = 0.22;
  farmRoad.receiveShadow = true;
  root.add(farmRoad);

  // City Roads (Paved asphalt streets in a grid)
  const cityRoadMat = new THREE.MeshStandardMaterial({ map: createHighwayRoadTexture(), roughness: 0.85 });
  cityRoadMat.map!.repeat.set(1, 15);

  const cityAvenue1 = new THREE.Mesh(new THREE.PlaneGeometry(18, 320).rotateX(-Math.PI / 2), cityRoadMat);
  cityAvenue1.position.set(260, 0.05, 220);
  root.add(cityAvenue1);

  const cityAvenue2 = new THREE.Mesh(new THREE.PlaneGeometry(18, 320).rotateX(-Math.PI / 2), cityRoadMat);
  cityAvenue2.position.set(260, 0.05, 220);
  cityAvenue2.rotation.y = Math.PI / 2;
  root.add(cityAvenue2);

  // Highway Direction Gantry sign board over the road approaching Metro City
  const gantryGroup = new THREE.Group();
  gantryGroup.position.set(185, 0, 160);
  gantryGroup.rotation.y = Math.PI / 4;
  const gantryPostGeo = new THREE.CylinderGeometry(0.3, 0.35, 7.5, 8);
  const gantrySteelMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8, roughness: 0.3 });
  const gPoleL = new THREE.Mesh(gantryPostGeo, gantrySteelMat);
  gPoleL.position.set(-13, 3.75, 0);
  const gPoleR = gPoleL.clone();
  gPoleR.position.set(13, 3.75, 0);
  gantryGroup.add(gPoleL, gPoleR);

  const gantryBeam = new THREE.Mesh(new THREE.BoxGeometry(27, 0.8, 0.8), gantrySteelMat);
  gantryBeam.position.set(0, 7.2, 0);
  gantryGroup.add(gantryBeam);

  const dirSignMesh = new THREE.Mesh(
    new THREE.BoxGeometry(16, 4.2, 0.25),
    new THREE.MeshStandardMaterial({ map: createHighwayDirectionTexture() })
  );
  dirSignMesh.position.set(0, 5.8, 0);
  gantryGroup.add(dirSignMesh);
  root.add(gantryGroup);
  addObstacle(new THREE.Vector3(185 - 9, 3.5, 160 - 9), new THREE.Vector3(2, 7, 2), 'highway_gantry_pole');
  addObstacle(new THREE.Vector3(185 + 9, 3.5, 160 + 9), new THREE.Vector3(2, 7, 2), 'highway_gantry_pole');

  // Grand Metro City Welcome Arch over the highway entrance into city
  const cityArchGroup = new THREE.Group();
  cityArchGroup.position.set(215, 0, 185);
  cityArchGroup.rotation.y = Math.PI / 4;

  const archPillarGeo = new THREE.BoxGeometry(2.0, 8.5, 2.0);
  const archConcreteMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7 });
  const cPillarL = new THREE.Mesh(archPillarGeo, archConcreteMat);
  cPillarL.position.set(-13, 4.25, 0);
  const cPillarR = cPillarL.clone();
  cPillarR.position.set(13, 4.25, 0);
  cityArchGroup.add(cPillarL, cPillarR);

  // Modern blue illuminated portal bridge
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(28, 2.2, 2.2), new THREE.MeshStandardMaterial({ color: '#0284c7' }));
  archTop.position.set(0, 8.2, 0);
  cityArchGroup.add(archTop);

  const citySignBoard = new THREE.Mesh(
    new THREE.BoxGeometry(22, 3.2, 0.3),
    new THREE.MeshStandardMaterial({ map: createCityWelcomeTexture() })
  );
  citySignBoard.position.set(0, 8.2, 1.25);
  cityArchGroup.add(citySignBoard);
  const citySignBoardBack = citySignBoard.clone();
  citySignBoardBack.position.z = -1.25;
  citySignBoardBack.rotation.y = Math.PI;
  cityArchGroup.add(citySignBoardBack);
  root.add(cityArchGroup);
  addObstacle(new THREE.Vector3(215 - 9, 4, 185 - 9), new THREE.Vector3(2.5, 8, 2.5), 'city_arch_pole');
  addObstacle(new THREE.Vector3(215 + 9, 4, 185 + 9), new THREE.Vector3(2.5, 8, 2.5), 'city_arch_pole');

  // Painted Zebra Crossings at City 4-Way Crossroads (260, 0, 220)
  const zebraMat = new THREE.MeshBasicMaterial({ color: '#f8fafc', side: THREE.DoubleSide });
  const zebraOffsets = [
    { x: 260, z: 202, rot: 0 },
    { x: 260, z: 238, rot: 0 },
    { x: 242, z: 220, rot: Math.PI / 2 },
    { x: 278, z: 220, rot: Math.PI / 2 },
  ];
  zebraOffsets.forEach((zo) => {
    const zebraGroup = new THREE.Group();
    zebraGroup.position.set(zo.x, 0.06, zo.z);
    zebraGroup.rotation.y = zo.rot;
    for (let s = -7; s <= 7; s += 2) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 3.5).rotateX(-Math.PI / 2), zebraMat);
      stripe.position.set(s, 0, 0);
      zebraGroup.add(stripe);
    }
    root.add(zebraGroup);
  });

  // Airport Link Road
  const airportRoad = new THREE.Mesh(new THREE.PlaneGeometry(14, 350).rotateX(-Math.PI / 2), cityRoadMat);
  airportRoad.position.set(-220, 0.05, 220);
  root.add(airportRoad);

  // 3. RAMPUR VILLAGE BUILDINGS & ENVIRONMENT
  const brickMat = new THREE.MeshStandardMaterial({ map: createBrickTexture(), roughness: 0.9 });
  brickMat.map!.repeat.set(3, 2);

  const mudMat = new THREE.MeshStandardMaterial({ color: '#c29b68', roughness: 0.95 });
  const tileRoofMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.85 }); // terracotta tiles
  const thatchRoofMat = new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.98 });

  // Village Arch at entrance
  const archGroup = new THREE.Group();
  archGroup.position.set(-170, 0, -150);
  archGroup.rotation.y = Math.PI / 4;
  const pillarGeo = new THREE.BoxGeometry(1.2, 5.5, 1.2);
  const pL = new THREE.Mesh(pillarGeo, brickMat);
  pL.position.set(-6, 2.75, 0);
  const pR = pL.clone();
  pR.position.set(6, 2.75, 0);
  archGroup.add(pL, pR);

  const archBoard = new THREE.Mesh(new THREE.BoxGeometry(13.5, 1.8, 0.4), new THREE.MeshStandardMaterial({ map: createVillageArchTexture() }));
  archBoard.position.set(0, 5.2, 0);
  archGroup.add(archBoard);
  root.add(archGroup);
  addObstacle(new THREE.Vector3(-170 - 4, 2.5, -150), new THREE.Vector3(2, 5, 2), 'village_arch');
  addObstacle(new THREE.Vector3(-170 + 4, 2.5, -150), new THREE.Vector3(2, 5, 2), 'village_arch');

  // Village Houses (10 traditional homes with verandahs)
  const housePositions = [
    { x: -280, z: -180, rot: 0.2, mud: false },
    { x: -250, z: -140, rot: -0.4, mud: true },
    { x: -310, z: -210, rot: 0.6, mud: false },
    { x: -210, z: -260, rot: 1.1, mud: true },
    { x: -270, z: -290, rot: -0.3, mud: false },
    { x: -330, z: -160, rot: 0.8, mud: true },
    { x: -190, z: -210, rot: -1.2, mud: false },
    { x: -230, z: -320, rot: 0.4, mud: false },
  ];

  housePositions.forEach((hp, idx) => {
    const house = new THREE.Group();
    house.position.set(hp.x, 0, hp.z);
    house.rotation.y = hp.rot;

    // Main walls
    const wallGeo = new THREE.BoxGeometry(9, 3.8, 6.5);
    const wall = new THREE.Mesh(wallGeo, hp.mud ? mudMat : brickMat);
    wall.position.y = 1.9;
    wall.castShadow = true;
    wall.receiveShadow = true;
    house.add(wall);

    // Sloping roof (terracotta or thatch)
    const roofGeo = new THREE.ConeGeometry(6.8, 2.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, hp.mud ? thatchRoofMat : tileRoofMat);
    roof.position.y = 4.8;
    roof.scale.set(1.1, 1, 0.85);
    roof.castShadow = true;
    house.add(roof);

    // Wooden Verandah pillars
    const woodPillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8);
    const woodMat = new THREE.MeshStandardMaterial({ color: '#573419', roughness: 0.9 });
    const wp1 = new THREE.Mesh(woodPillarGeo, woodMat);
    wp1.position.set(-3.5, 1.6, 4.2);
    const wp2 = wp1.clone();
    wp2.position.set(3.5, 1.6, 4.2);
    house.add(wp1, wp2);

    // Charpai (Indian woven rope cot) in front of house
    const cot = new THREE.Group();
    cot.position.set(2.5, 0, 4.5);
    const cotBed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 1.2), new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.9 }));
    cotBed.position.y = 0.45;
    cot.add(cotBed);
    for (let lx of [-0.95, 0.95]) {
      for (let lz of [-0.45, 0.45]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 6), woodMat);
        leg.position.set(lx, 0.22, lz);
        cot.add(leg);
      }
    }
    house.add(cot);

    root.add(house);
    addObstacle(new THREE.Vector3(hp.x, 2, hp.z), new THREE.Vector3(10, 4, 8), `village_house_${idx}`);
  });

  // Ancient Village Temple (Mandir)
  const temple = new THREE.Group();
  temple.position.set(-290, 0, -280);
  const templeBaseGeo = new THREE.BoxGeometry(16, 1.5, 16);
  const marbleMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3, metalness: 0.1 });
  const templeBase = new THREE.Mesh(templeBaseGeo, marbleMat);
  templeBase.position.y = 0.75;
  temple.add(templeBase);

  // Sanctum
  const sanctumGeo = new THREE.BoxGeometry(10, 5.5, 10);
  const sanctum = new THREE.Mesh(sanctumGeo, marbleMat);
  sanctum.position.y = 4.25;
  sanctum.castShadow = true;
  temple.add(sanctum);

  // Shikhara (Spire)
  const spireGeo = new THREE.ConeGeometry(5, 7.5, 8);
  const saffronMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.4 });
  const spire = new THREE.Mesh(spireGeo, saffronMat);
  spire.position.y = 10.5;
  temple.add(spire);

  // Golden Kalash & Saffron Flag (Dhwaj)
  const kalashGeo = new THREE.SphereGeometry(0.5, 12, 12);
  const goldMat = new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.9, roughness: 0.2 });
  const kalash = new THREE.Mesh(kalashGeo, goldMat);
  kalash.position.y = 14.5;
  temple.add(kalash);

  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 6), goldMat);
  flagPole.position.set(0, 16, 0);
  temple.add(flagPole);

  const flagGeo = new THREE.BufferGeometry();
  const flagVerts = new Float32Array([
    0, 17.2, 0,
    1.6, 16.4, 0,
    0, 15.6, 0,
  ]);
  flagGeo.setAttribute('position', new THREE.BufferAttribute(flagVerts, 3));
  flagGeo.computeVertexNormals();
  const flagMesh = new THREE.Mesh(flagGeo, new THREE.MeshBasicMaterial({ color: '#f97316', side: THREE.DoubleSide }));
  temple.add(flagMesh);

  root.add(temple);
  addObstacle(new THREE.Vector3(-290, 4, -280), new THREE.Vector3(16, 8, 16), 'temple');

  // Tube-Well (Water pump & stone tank)
  const tubeWell = new THREE.Group();
  tubeWell.position.set(-220, 0, -170);
  const tankMesh = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 4.5), concreteMat);
  tankMesh.position.y = 0.6;
  tubeWell.add(tankMesh);
  const waterMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 4.2), riverMat);
  waterMesh.position.y = 1.0;
  tubeWell.add(waterMesh);
  const pumpPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.2, 8), new THREE.MeshStandardMaterial({ color: '#15803d' }));
  pumpPillar.position.set(0, 1.5, 0);
  tubeWell.add(pumpPillar);
  root.add(tubeWell);
  addObstacle(new THREE.Vector3(-220, 1, -170), new THREE.Vector3(5, 2, 5), 'tube_well');

  // Mustard & Wheat Crop Fields
  const cropMat = new THREE.MeshStandardMaterial({ map: createMustardCropTexture(), roughness: 0.9 });
  cropMat.map!.repeat.set(8, 8);
  const field1 = new THREE.Mesh(new THREE.PlaneGeometry(85, 70).rotateX(-Math.PI / 2), cropMat);
  field1.position.set(-210, 0.08, -100);
  root.add(field1);

  const field2 = new THREE.Mesh(new THREE.PlaneGeometry(100, 65).rotateX(-Math.PI / 2), cropMat);
  field2.position.set(-340, 0.08, -220);
  root.add(field2);

  // Highway Dhaba (Sher-e-Punjab Dhaba)
  const dhaba = new THREE.Group();
  dhaba.position.set(-120, 0, -110);
  dhaba.rotation.y = Math.PI / 4;

  const dhabaMain = new THREE.Mesh(new THREE.BoxGeometry(18, 4.2, 10), brickMat);
  dhabaMain.position.y = 2.1;
  dhaba.add(dhabaMain);

  const dhabaSign = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.3), new THREE.MeshStandardMaterial({ map: createDhabaSignTexture() }));
  dhabaSign.position.set(0, 5.0, 5.15);
  dhaba.add(dhabaSign);

  // Outdoor Dhaba Charpais and Plastic Chairs
  for (let cx = -6; cx <= 6; cx += 4) {
    const dCot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.4), new THREE.MeshStandardMaterial({ color: '#78350f' }));
    dCot.position.set(cx, 0.2, 7.5);
    dhaba.add(dCot);
  }

  // Tandoor oven (Clay cylinder)
  const tandoor = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.2, 12), new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.95 }));
  tandoor.position.set(7.5, 0.6, 6.5);
  dhaba.add(tandoor);

  root.add(dhaba);
  addObstacle(new THREE.Vector3(-120, 2.5, -110), new THREE.Vector3(20, 5, 12), 'dhaba');

  // 4. HIGHWAY TOLL PLAZA (NH-44 Toll Gate)
  const tollGroup = new THREE.Group();
  tollGroup.position.set(-20, 0, -10);
  tollGroup.rotation.y = Math.PI / 4;

  // Road Apron: Widened asphalt plaza tarmac under and around booths
  const apronGeo = new THREE.PlaneGeometry(36, 60);
  apronGeo.rotateX(-Math.PI / 2);
  const apronMat = new THREE.MeshStandardMaterial({ color: '#1f2429', roughness: 0.9 });
  const apron = new THREE.Mesh(apronGeo, apronMat);
  apron.position.y = 0.045;
  apron.receiveShadow = true;
  tollGroup.add(apron);

  // Rumble Strips / Speed Breakers on approach roads (yellow/black safety bars)
  const rumbleMatYel = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.5 });
  const rumbleMatBlk = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7 });
  for (let zOffset of [-18, -14, 14, 18]) {
    for (let r = -14; r <= 14; r += 2) {
      const isYel = Math.abs(r) % 4 === 0;
      const rumble = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.6), isYel ? rumbleMatYel : rumbleMatBlk);
      rumble.position.set(r, 0.06, zOffset);
      tollGroup.add(rumble);
    }
  }

  // White painted road stop lines in front of barriers
  const stopLineMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
  const stopLineL = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.6).rotateX(-Math.PI / 2), stopLineMat);
  stopLineL.position.set(-3.7, 0.052, 1.2);
  const stopLineR = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.6).rotateX(-Math.PI / 2), stopLineMat);
  stopLineR.position.set(3.7, 0.052, 1.2);
  tollGroup.add(stopLineL, stopLineR);

  // Overhead Gantry Canopy
  const gantryGeo = new THREE.BoxGeometry(34, 1.4, 6);
  const gantry = new THREE.Mesh(gantryGeo, concreteMat);
  gantry.position.y = 6.2;
  tollGroup.add(gantry);

  // Lane LED Indicator Boards (Green Arrow for open lanes, Red X for closed)
  const laneBoards = [
    { x: -7.5, open: true, label: 'LANE 1 • FASTag' },
    { x: 0, open: true, label: 'LANE 2 • FASTag' },
    { x: 7.5, open: true, label: 'LANE 3 • CASH' },
  ];
  laneBoards.forEach((lb) => {
    const board = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 0.3), new THREE.MeshStandardMaterial({ color: '#020617' }));
    board.position.set(lb.x, 5.2, 3.1);
    // Green illuminated indicator
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: lb.open ? '#22c55e' : '#ef4444', emissive: lb.open ? '#22c55e' : '#ef4444', emissiveIntensity: 2.0 })
    );
    led.position.set(1.5, 0, 0.2);
    board.add(led);
    tollGroup.add(board);
  });

  // Toll Plaza Signboard
  const tollSignMat = new THREE.MeshStandardMaterial({ map: createTollSignTexture() });
  const tollSignMesh = new THREE.Mesh(new THREE.BoxGeometry(18, 3.2, 0.2), tollSignMat);
  tollSignMesh.position.set(0, 8.2, 3.0);
  tollGroup.add(tollSignMesh);
  const tollSignBack = tollSignMesh.clone();
  tollSignBack.position.z = -3.0;
  tollSignBack.rotation.y = Math.PI;
  tollGroup.add(tollSignBack);

  // 4 Toll Booths
  const boothGeo = new THREE.BoxGeometry(1.8, 3.2, 4.5);
  const boothMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.5 });
  const boothGlassMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.1, transparent: true, opacity: 0.7 });

  const boothPositions = [-11, -3.7, 3.7, 11];
  boothPositions.forEach((bx, idx) => {
    const booth = new THREE.Mesh(boothGeo, boothMat);
    booth.position.set(bx, 1.6, 0);
    tollGroup.add(booth);

    // Booth window
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.82, 1.2, 2.5), boothGlassMat);
    win.position.set(bx, 2.1, 0);
    tollGroup.add(win);

    // Pillar supporting gantry
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.2, 0.8), concreteMat);
    p.position.set(bx, 3.1, 0);
    tollGroup.add(p);

    addObstacle(new THREE.Vector3(-20 + bx * 0.707, 2, -10 + bx * 0.707), new THREE.Vector3(2.2, 4, 4.8), `toll_booth_${idx}`);
  });

  // Animated Barrier Arms (Left lane and Right lane)
  const barrierGeo = new THREE.BoxGeometry(5.8, 0.16, 0.16);
  const barrierMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3 }); // Red/white striped barrier
  const barrierL = new THREE.Group();
  barrierL.position.set(-3.7, 1.1, 2.2);
  const barMeshL = new THREE.Mesh(barrierGeo, barrierMat);
  barMeshL.position.x = 2.9;
  barrierL.add(barMeshL);
  tollGroup.add(barrierL);

  const barrierR = new THREE.Group();
  barrierR.position.set(3.7, 1.1, 2.2);
  const barMeshR = new THREE.Mesh(barrierGeo, barrierMat);
  barMeshR.position.x = -2.9;
  barrierR.add(barMeshR);
  tollGroup.add(barrierR);

  root.add(tollGroup);

  const tollGateState: TollGateState = {
    barrierL,
    barrierR,
    pos: new THREE.Vector3(-20, 0, -10),
    width: 24,
    openAngle: Math.PI / 2.2,
    currentAngle: 0,
    isOpen: false,
    isVehicleInside: false,
  };

  // 5. PETROL STATION & REPAIR GARAGE (Indian Oil)
  const fuelStation = new THREE.Group();
  fuelStation.position.set(80, 0, 70);
  fuelStation.rotation.y = Math.PI / 4;

  // Station Paved Forecourt
  const forecourt = new THREE.Mesh(new THREE.PlaneGeometry(60, 45).rotateX(-Math.PI / 2), roadMat);
  forecourt.position.y = 0.05;
  fuelStation.add(forecourt);

  // Large Illuminated Canopy
  const canopyGeo = new THREE.BoxGeometry(32, 1.2, 22);
  const canopy = new THREE.Mesh(canopyGeo, new THREE.MeshStandardMaterial({ color: '#ea580c' }));
  canopy.position.y = 6.2;
  canopy.castShadow = true;
  fuelStation.add(canopy);

  // Canopy Branding Sign
  const fuelSignMesh = new THREE.Mesh(new THREE.BoxGeometry(26, 2.2, 0.2), new THREE.MeshStandardMaterial({ map: createPetrolSignTexture() }));
  fuelSignMesh.position.set(0, 6.2, 11.1);
  fuelStation.add(fuelSignMesh);

  // Canopy Pillars (4 steel columns)
  for (let px of [-10, 10]) {
    for (let pz of [-6, 6]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 6.2, 12), new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.8 }));
      col.position.set(px, 3.1, pz);
      fuelStation.add(col);
      addObstacle(new THREE.Vector3(80 + (px * Math.cos(Math.PI / 4) - pz * Math.sin(Math.PI / 4)), 3, 70 + (px * Math.sin(Math.PI / 4) + pz * Math.cos(Math.PI / 4))), new THREE.Vector3(1, 6, 1), 'pump_pillar');
    }
  }

  // 4 Fuel Dispensers (Petrol / Diesel / CNG)
  for (let px of [-5, 5]) {
    const island = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 8), concreteMat);
    island.position.set(px, 0.15, 0);
    fuelStation.add(island);

    for (let pz of [-2.2, 2.2]) {
      const pumpGeo = new THREE.BoxGeometry(0.8, 2.2, 1.2);
      const pump = new THREE.Mesh(pumpGeo, new THREE.MeshStandardMaterial({ color: '#0284c7' }));
      pump.position.set(px, 1.25, pz);
      fuelStation.add(pump);
    }
  }

  // Station Convenience Shop & Repair Garage Bay
  const shopGeo = new THREE.BoxGeometry(22, 4.5, 12);
  const shop = new THREE.Mesh(shopGeo, new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.7 }));
  shop.position.set(0, 2.25, -18);
  shop.castShadow = true;
  fuelStation.add(shop);

  // Garage Roll-Up Door
  const garageDoor = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.5, 0.2), new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.7, roughness: 0.4 }));
  garageDoor.position.set(5.5, 1.75, -11.9);
  fuelStation.add(garageDoor);

  root.add(fuelStation);
  addObstacle(new THREE.Vector3(80, 2.5, 70), new THREE.Vector3(25, 5, 25), 'fuel_station_shop');

  // 6. METRO CITY CENTER
  const cityGroup = new THREE.Group();
  cityGroup.position.set(260, 0, 220);

  // Modern Multi-Story City Buildings (14 buildings around avenues)
  const buildingColors = ['#e2e8f0', '#cbd5e1', '#64748b', '#475569', '#3b82f6', '#0284c7', '#0f766e', '#1e293b'];
  const buildingLayouts = [
    { x: -55, z: -55, w: 28, d: 24, h: 42 },
    { x: 55, z: -55, w: 26, d: 26, h: 56 },
    { x: -55, z: 55, w: 24, d: 28, h: 36 },
    { x: 55, z: 55, w: 30, d: 26, h: 48 },
    { x: -95, z: -55, w: 22, d: 24, h: 28 },
    { x: 95, z: -55, w: 24, d: 22, h: 32 },
    { x: -95, z: 55, w: 22, d: 26, h: 26 },
    { x: 95, z: 55, w: 26, d: 22, h: 38 },
    { x: -55, z: -95, w: 26, d: 22, h: 34 },
    { x: 55, z: -95, w: 24, d: 24, h: 44 },
    { x: -55, z: 95, w: 24, d: 22, h: 30 },
    { x: 55, z: 95, w: 26, d: 24, h: 50 },
  ];

  buildingLayouts.forEach((bld, idx) => {
    const bColor = buildingColors[idx % buildingColors.length];
    const bGeo = new THREE.BoxGeometry(bld.w, bld.h, bld.d);
    const bMat = new THREE.MeshStandardMaterial({
      color: bColor,
      roughness: 0.4,
      metalness: 0.3,
    });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(bld.x, bld.h / 2, bld.z);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    cityGroup.add(bMesh);

    // Window grid texture simulation (rows of tinted glass windows)
    const winGeo = new THREE.BoxGeometry(bld.w + 0.2, bld.h * 0.85, bld.d + 0.2);
    const winMat = new THREE.MeshPhysicalMaterial({
      color: '#0f172a',
      roughness: 0.1,
      metalness: 0.8,
      transmission: 0.5,
      transparent: true,
      opacity: 0.75,
    });
    const winMesh = new THREE.Mesh(winGeo, winMat);
    winMesh.position.set(bld.x, bld.h / 2, bld.z);
    cityGroup.add(winMesh);

    // Roof rooftop water tank
    const tankMesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 10), new THREE.MeshStandardMaterial({ color: '#1e293b' }));
    tankMesh.position.set(bld.x, bld.h + 1.5, bld.z);
    cityGroup.add(tankMesh);

    addObstacle(new THREE.Vector3(260 + bld.x, bld.h / 2, 220 + bld.z), new THREE.Vector3(bld.w + 1, bld.h, bld.d + 1), `city_building_${idx}`);
  });

  // Working Traffic Signals at City 4-Way Intersection
  const signalGeo = new THREE.BoxGeometry(0.8, 2.2, 0.8);
  const signalCorners = [
    { x: -10, z: -10, rot: 0 },
    { x: 10, z: -10, rot: -Math.PI / 2 },
    { x: 10, z: 10, rot: Math.PI },
    { x: -10, z: 10, rot: Math.PI / 2 },
  ];

  const darkTrimMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
  signalCorners.forEach((sc) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 8), darkTrimMat);
    post.position.set(sc.x, 3, sc.z);
    cityGroup.add(post);

    const box = new THREE.Mesh(signalGeo, new THREE.MeshStandardMaterial({ color: '#1e293b' }));
    box.position.set(sc.x, 5.5, sc.z);
    box.rotation.y = sc.rot;
    cityGroup.add(box);

    // 3 lights: Red, Yellow, Green
    const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.5 }));
    redLight.position.set(0, 0.6, 0.42);
    box.add(redLight);

    const yelLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: '#eab308', emissive: '#000000', emissiveIntensity: 0.1 }));
    yelLight.position.set(0, 0, 0.42);
    box.add(yelLight);

    const grnLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#000000', emissiveIntensity: 0.1 }));
    grnLight.position.set(0, -0.6, 0.42);
    box.add(grnLight);

    box.userData = { red: redLight, yellow: yelLight, green: grnLight };
    trafficLights.push(box);
  });

  // Marked Parking Bays in City
  const parkGeo = new THREE.PlaneGeometry(16, 26).rotateX(-Math.PI / 2);
  const parkMat = new THREE.MeshStandardMaterial({ color: '#334155' });
  const parkBay = new THREE.Mesh(parkGeo, parkMat);
  parkBay.position.set(-25, 0.06, 25);
  cityGroup.add(parkBay);

  root.add(cityGroup);

  // 7. BHARATPUR AIRPORT AREA
  const airportGroup = new THREE.Group();
  airportGroup.position.set(-220, 0, 260);

  // Long Runway (09/27)
  const runwayGeo = new THREE.PlaneGeometry(36, 420).rotateX(-Math.PI / 2);
  const runwayMat = new THREE.MeshStandardMaterial({ map: createRunwayTexture(), roughness: 0.8 });
  runwayMat.map!.repeat.set(1, 8);
  const runway = new THREE.Mesh(runwayGeo, runwayMat);
  runway.position.set(0, 0.05, 0);
  runway.receiveShadow = true;
  airportGroup.add(runway);

  // Airport Terminal Building
  const terminalGeo = new THREE.BoxGeometry(65, 8.5, 28);
  const terminalMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3 });
  const terminal = new THREE.Mesh(terminalGeo, terminalMat);
  terminal.position.set(55, 4.25, 0);
  terminal.castShadow = true;
  airportGroup.add(terminal);

  // Glass facade & Signboard
  const termSign = new THREE.Mesh(new THREE.BoxGeometry(32, 2.5, 0.2), new THREE.MeshStandardMaterial({ map: createAirportSignTexture() }));
  termSign.position.set(55, 9.5, 14.1);
  airportGroup.add(termSign);

  // ATC Control Tower
  const towerGeo = new THREE.CylinderGeometry(3.5, 4.5, 28, 16);
  const tower = new THREE.Mesh(towerGeo, concreteMat);
  tower.position.set(55, 14, -40);
  tower.castShadow = true;
  airportGroup.add(tower);

  // ATC Glass Observation Cab
  const cabGeo = new THREE.CylinderGeometry(5.2, 4.0, 4.5, 16);
  const cab = new THREE.Mesh(cabGeo, new THREE.MeshPhysicalMaterial({ color: '#0284c7', transmission: 0.8, roughness: 0.1, transparent: true, opacity: 0.85 }));
  cab.position.set(55, 29, -40);
  airportGroup.add(cab);

  // Parked Twin-Engine Propeller Cargo Airplane
  const plane = new THREE.Group();
  plane.position.set(28, 0, 80);
  plane.rotation.y = -Math.PI / 3;

  // Fuselage
  const fuseGeo = new THREE.CylinderGeometry(1.4, 1.4, 16, 12);
  fuseGeo.rotateX(Math.PI / 2);
  const planeMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.7, roughness: 0.25 });
  const fuselage = new THREE.Mesh(fuseGeo, planeMat);
  fuselage.position.y = 2.4;
  fuselage.castShadow = true;
  plane.add(fuselage);

  // Wings
  const wingGeo = new THREE.BoxGeometry(22, 0.2, 3.2);
  const wings = new THREE.Mesh(wingGeo, planeMat);
  wings.position.set(0, 2.5, 1);
  plane.add(wings);

  // Tail vertical stabilizer
  const tailGeo = new THREE.BoxGeometry(0.2, 3.2, 2.4);
  const tail = new THREE.Mesh(tailGeo, new THREE.MeshStandardMaterial({ color: '#ea580c' }));
  tail.position.set(0, 4.2, -6.5);
  plane.add(tail);

  airportGroup.add(plane);
  root.add(airportGroup);

  addObstacle(new THREE.Vector3(-220 + 55, 4.25, 260), new THREE.Vector3(68, 9, 30), 'airport_terminal');
  addObstacle(new THREE.Vector3(-220 + 55, 14, 260 - 40), new THREE.Vector3(10, 30, 10), 'airport_atc_tower');
  addObstacle(new THREE.Vector3(-220 + 28, 2, 260 + 80), new THREE.Vector3(22, 5, 18), 'airport_cargo_plane');

  // 8. PROCEDURAL INSTANCED TREES (BANYAN, NEEM, PALMS)
  // Assemble composite tree (trunk + foliage layers)
  const treeCount = 260;
  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 4.5, 8);
  const foliageGeo = new THREE.DodecahedronGeometry(2.8, 1);

  const trunkMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.95 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.85 });

  const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const foliageInstanced = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
  trunkInstanced.castShadow = true;
  foliageInstanced.castShadow = true;

  const dummy = new THREE.Object3D();
  let instIdx = 0;

  for (let i = 0; i < treeCount; i++) {
    // Distribute around village borders, river banks, and roadside groves
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 450;
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;

    // Avoid planting right in middle of roads or runway
    if (Math.abs(tx - tz) < 22 && Math.abs(tx) < 320) continue; // highway clearance
    if (Math.hypot(tx - (-220), tz - 260) < 140) continue; // airport runway clearance
    if (Math.hypot(tx - 260, tz - 220) < 110) continue; // city center clearance

    const ty = getTerrainHeight(tx, tz);
    const scale = 0.75 + Math.random() * 0.55;

    // Trunk
    dummy.position.set(tx, ty + (4.5 * scale) / 2, tz);
    dummy.scale.set(scale, scale, scale);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(instIdx, dummy.matrix);

    // Foliage
    dummy.position.set(tx, ty + 4.5 * scale + 1.2 * scale, tz);
    dummy.updateMatrix();
    foliageInstanced.setMatrixAt(instIdx, dummy.matrix);

    // Foliage subtle color variation
    const greenTone = new THREE.Color().setHSL(0.28 + Math.random() * 0.08, 0.7, 0.28 + Math.random() * 0.15);
    foliageInstanced.setColorAt(instIdx, greenTone);

    instIdx++;
    if (instIdx < 45) {
      // Add collision for closest trees
      addObstacle(new THREE.Vector3(tx, ty + 2, tz), new THREE.Vector3(1.4, 5, 1.4), `tree_${i}`);
    }
  }
  trunkInstanced.count = instIdx;
  foliageInstanced.count = instIdx;
  trunkInstanced.computeBoundingSphere();
  foliageInstanced.computeBoundingSphere();
  root.add(trunkInstanced, foliageInstanced);

  // 9. ANIMATED NPC PEDESTRIANS
  const villagerColors = ['#ea580c', '#f59e0b', '#059669', '#2563eb', '#9333ea', '#e11d48'];
  const pedestrianConfigs = [
    { start: new THREE.Vector3(-240, 0, -200), waypoints: [new THREE.Vector3(-240, 0, -200), new THREE.Vector3(-280, 0, -200), new THREE.Vector3(-280, 0, -250), new THREE.Vector3(-240, 0, -250)] },
    { start: new THREE.Vector3(-220, 0, -160), waypoints: [new THREE.Vector3(-220, 0, -160), new THREE.Vector3(-190, 0, -160), new THREE.Vector3(-190, 0, -190), new THREE.Vector3(-220, 0, -190)] },
    { start: new THREE.Vector3(240, 0, 200), waypoints: [new THREE.Vector3(240, 0, 200), new THREE.Vector3(280, 0, 200), new THREE.Vector3(280, 0, 240), new THREE.Vector3(240, 0, 240)] },
    { start: new THREE.Vector3(250, 0, 180), waypoints: [new THREE.Vector3(250, 0, 180), new THREE.Vector3(250, 0, 260), new THREE.Vector3(270, 0, 260), new THREE.Vector3(270, 0, 180)] },
  ];

  pedestrianConfigs.forEach((cfg, idx) => {
    const pedGroup = new THREE.Group();
    pedGroup.position.copy(cfg.start);

    // Torso / Kurta
    const bodyMat = new THREE.MeshStandardMaterial({ color: villagerColors[idx % villagerColors.length], roughness: 0.9 });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.9, 8), bodyMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    pedGroup.add(torso);

    // Head with Turban / Cap
    const headMat = new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.8 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), headMat);
    head.position.y = 1.62;
    pedGroup.add(head);

    const turban = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.16, 8), new THREE.MeshStandardMaterial({ color: '#ea580c' }));
    turban.position.y = 1.74;
    pedGroup.add(turban);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.12, 0.3, 0);
    const legR = legL.clone();
    legR.position.set(0.12, 0.3, 0);
    pedGroup.add(legL, legR);

    root.add(pedGroup);
    pedestrians.push({
      mesh: pedGroup,
      pos: cfg.start.clone(),
      dir: new THREE.Vector3(1, 0, 0),
      speed: 1.8 + Math.random() * 0.8,
      waypoints: cfg.waypoints,
      wpIndex: 0,
    });
  });

  // Traffic light state timer
  let trafficLightTimer = 0;
  let trafficLightPhase: 'green' | 'yellow' | 'red' = 'green';

  function update(delta: number) {
    // 1. Update Toll Gate Barrier Animation
    const targetAngle = tollGateState.isOpen ? tollGateState.openAngle : 0;
    tollGateState.currentAngle = THREE.MathUtils.damp(tollGateState.currentAngle, targetAngle, 4.5, delta);
    tollGateState.barrierL.rotation.z = tollGateState.currentAngle;
    tollGateState.barrierR.rotation.z = -tollGateState.currentAngle;

    // 2. Traffic Lights Timer Cycle (Green 8s, Yellow 2.5s, Red 7s)
    trafficLightTimer += delta;
    if (trafficLightPhase === 'green' && trafficLightTimer > 8) {
      trafficLightPhase = 'yellow';
      trafficLightTimer = 0;
    } else if (trafficLightPhase === 'yellow' && trafficLightTimer > 2.5) {
      trafficLightPhase = 'red';
      trafficLightTimer = 0;
    } else if (trafficLightPhase === 'red' && trafficLightTimer > 7) {
      trafficLightPhase = 'green';
      trafficLightTimer = 0;
    }

    trafficLights.forEach((tl) => {
      const u = tl.userData as { red: THREE.Mesh; yellow: THREE.Mesh; green: THREE.Mesh };
      if (!u || !u.red) return;
      const rMat = u.red.material as THREE.MeshStandardMaterial;
      const yMat = u.yellow.material as THREE.MeshStandardMaterial;
      const gMat = u.green.material as THREE.MeshStandardMaterial;

      rMat.emissiveIntensity = trafficLightPhase === 'red' ? 1.8 : 0.05;
      yMat.emissiveIntensity = trafficLightPhase === 'yellow' ? 1.8 : 0.05;
      gMat.emissiveIntensity = trafficLightPhase === 'green' ? 1.8 : 0.05;
    });

    // 3. Update NPC Pedestrians along paths
    pedestrians.forEach((ped) => {
      const targetWp = ped.waypoints[ped.wpIndex];
      const dist = ped.pos.distanceTo(targetWp);
      if (dist < 1.5) {
        ped.wpIndex = (ped.wpIndex + 1) % ped.waypoints.length;
      } else {
        const stepDir = new THREE.Vector3().subVectors(targetWp, ped.pos).normalize();
        ped.pos.addScaledVector(stepDir, ped.speed * delta);
        ped.mesh.position.copy(ped.pos);
        ped.mesh.rotation.y = Math.atan2(stepDir.x, stepDir.z);

        // Gentle walking bob
        ped.mesh.position.y = Math.abs(Math.sin(Date.now() * 0.008)) * 0.08;
      }
    });
  }

  return {
    root,
    collisionBoxes,
    landmarks,
    tollGate: tollGateState,
    trafficLights,
    pedestrians,
    update,
    getTerrainHeight,
  };
}
