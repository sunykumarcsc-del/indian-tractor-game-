/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface RoadSegment {
  id: string;
  name: string;
  hindiName: string;
  points: [number, number][]; // [x, z] waypoints along road center
  width: number;
  type: 'highway' | 'village' | 'city' | 'airport' | 'farm';
}

// Master interconnected road network of the open world
export const WORLD_ROAD_NETWORK: RoadSegment[] = [
  // 1. NH-44 Grand Highway (Diagonal connecting Rampur Village through Toll to Metro City)
  {
    id: 'nh44_highway',
    name: 'NH-44 National Highway',
    hindiName: 'एनएच-44 राष्ट्रीय राजमार्ग',
    points: [
      [-260, -260],
      [-190, -190],
      [-120, -120], // near Dhaba
      [-50, -50],
      [-20, -10],   // Toll Plaza!
      [20, 25],
      [80, 80],     // near Petrol Station
      [150, 140],
      [220, 200],
      [260, 220],   // City Entrance
    ],
    width: 24,
    type: 'highway',
  },
  // 2. Rampur Village Main Dirt Path
  {
    id: 'village_main',
    name: 'Rampur Village Road',
    hindiName: 'रामपुर गाँव मुख्य मार्ग',
    points: [
      [-170, -150], // Village Entrance Arch
      [-200, -170], // Tube-well
      [-240, -220], // Village Center Chowk
      [-290, -280], // Mandir Temple
    ],
    width: 14,
    type: 'village',
  },
  // 3. Farm Field Access Track (connecting Village Chowk to the Plowing Farm Field)
  {
    id: 'farm_access',
    name: 'Farm Field Plowing Track',
    hindiName: 'खेत जुताई संपर्क मार्ग',
    points: [
      [-240, -220], // Village Center
      [-230, -160],
      [-210, -100], // Rampur Farm Field!
    ],
    width: 12,
    type: 'farm',
  },
  // 4. Highway to Village Connector Link
  {
    id: 'highway_village_link',
    name: 'Rampur Highway Link',
    hindiName: 'रामपुर लिंक रोड',
    points: [
      [-190, -190], // Highway junction
      [-170, -150], // Village Arch
    ],
    width: 14,
    type: 'village',
  },
  // 5. Metro City North-South Grand Avenue
  {
    id: 'city_ns_avenue',
    name: 'Metro City North-South Ave',
    hindiName: 'मेट्रो सिटी मुख्य मार्ग',
    points: [
      [260, 80],
      [260, 150],
      [260, 220],   // City 4-Way Cross
      [260, 290],
      [260, 360],
    ],
    width: 18,
    type: 'city',
  },
  // 6. Metro City East-West Boulevard
  {
    id: 'city_ew_boulevard',
    name: 'City Commercial Boulevard',
    hindiName: 'सिटी कमर्शियल मार्ग',
    points: [
      [120, 220],
      [190, 220],
      [260, 220],   // City 4-Way Cross
      [330, 220],
      [400, 220],
    ],
    width: 18,
    type: 'city',
  },
  // 7. Airport Connector Highway
  {
    id: 'airport_link',
    name: 'Airport Express Road',
    hindiName: 'हवाई अड्डा संपर्क मार्ग',
    points: [
      [-20, -10],   // Toll Plaza junction
      [-100, 100],
      [-180, 200],
      [-220, 260],  // Airport Terminal
      [-200, 340],  // Runway Hangar
    ],
    width: 14,
    type: 'airport',
  },
];

export class RoadNavigator {
  public root: THREE.Group;
  private arrowMeshes: THREE.Mesh[] = [];
  private currentPath: THREE.Vector3[] = [];
  private activeTarget: THREE.Vector3 | null = null;
  private animTime: number = 0;

  constructor(sceneRoot: THREE.Object3D) {
    this.root = new THREE.Group();
    this.root.name = 'RoadNavigator_Chevrons';
    sceneRoot.add(this.root);

    // Build reusable 3D chevron arrow meshes for road surface guidance
    const arrowShape = new THREE.Shape();
    // Chevron shape pointed along -Z (Three.js forward)
    arrowShape.moveTo(0, -1.8);
    arrowShape.lineTo(1.4, -0.6);
    arrowShape.lineTo(0.9, -0.6);
    arrowShape.lineTo(0, -1.2);
    arrowShape.lineTo(-0.9, -0.6);
    arrowShape.lineTo(-1.4, -0.6);
    arrowShape.closePath();

    const chevronGeo = new THREE.ShapeGeometry(arrowShape);
    chevronGeo.rotateX(-Math.PI / 2);

    const chevronMat = new THREE.MeshBasicMaterial({
      color: '#10b981', // Glowing GPS emerald green / amber
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    for (let i = 0; i < 28; i++) {
      const mesh = new THREE.Mesh(chevronGeo, chevronMat.clone());
      mesh.position.set(0, 0.16, 0); // slightly above tarmac
      mesh.visible = false;
      this.root.add(mesh);
      this.arrowMeshes.push(mesh);
    }
  }

  /**
   * Set target navigation destination (e.g. active mission target, farm field, or toll)
   */
  public setTarget(target: [number, number, number] | null) {
    if (!target) {
      this.activeTarget = null;
      this.arrowMeshes.forEach((m) => (m.visible = false));
      return;
    }
    this.activeTarget = new THREE.Vector3(target[0], target[1], target[2]);
  }

  /**
   * Find closest road to a given world position
   */
  public getNearestRoadName(x: number, z: number): { name: string; hindiName: string; type: string } {
    let nearestDist = Infinity;
    let nearestSegment = WORLD_ROAD_NETWORK[0];

    for (const segment of WORLD_ROAD_NETWORK) {
      for (const pt of segment.points) {
        const d = Math.hypot(x - pt[0], z - pt[1]);
        if (d < nearestDist) {
          nearestDist = d;
          nearestSegment = segment;
        }
      }
    }

    if (nearestDist > 55) {
      return { name: 'Countryside Off-Road', hindiName: 'गाँव का कच्चा इलाका', type: 'village' };
    }
    return {
      name: nearestSegment.name,
      hindiName: nearestSegment.hindiName,
      type: nearestSegment.type,
    };
  }

  /**
   * Calculate next waypoint direction for HUD minimap turn arrow
   */
  public getNextDirectionVector(playerPos: THREE.Vector3): { dirX: number; dirZ: number; angle: number; dist: number } | null {
    if (!this.activeTarget) return null;

    const dx = this.activeTarget.x - playerPos.x;
    const dz = this.activeTarget.z - playerPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 4) return null;

    const angle = Math.atan2(dx, dz);
    return {
      dirX: dx / dist,
      dirZ: dz / dist,
      angle,
      dist: Math.round(dist),
    };
  }

  /**
   * Update road chevron arrows on the tarmac
   */
  public update(delta: number, playerPos: THREE.Vector3, playerHeading: number) {
    if (!this.activeTarget) {
      this.arrowMeshes.forEach((m) => (m.visible = false));
      return;
    }

    this.animTime += delta * 2.5;

    // Vector to target
    const toTarget = new THREE.Vector3().subVectors(this.activeTarget, playerPos);
    toTarget.y = 0;
    const totalDist = toTarget.length();

    if (totalDist < 5) {
      this.arrowMeshes.forEach((m) => (m.visible = false));
      return;
    }

    toTarget.normalize();

    // Place chevrons ahead of player along route
    const spacing = 7.5;
    const maxVisibleArrows = Math.min(this.arrowMeshes.length, Math.floor(totalDist / spacing));

    for (let i = 0; i < this.arrowMeshes.length; i++) {
      const mesh = this.arrowMeshes[i];
      if (i >= maxVisibleArrows || i >= 18) {
        mesh.visible = false;
        continue;
      }

      const offsetDist = (i + 1) * spacing + ((this.animTime % 1) * spacing);
      if (offsetDist > totalDist - 3) {
        mesh.visible = false;
        continue;
      }

      // Position along route line towards target
      const arrowPos = playerPos.clone().addScaledVector(toTarget, offsetDist);
      arrowPos.y = 0.16;

      mesh.position.copy(arrowPos);
      mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);

      // Pulse opacity from bright near player to fade in distance
      const distFade = Math.max(0.1, 1 - (offsetDist / 120));
      const waveFade = 0.6 + Math.sin(this.animTime * 3 + i * 0.4) * 0.35;
      (mesh.material as THREE.MeshBasicMaterial).opacity = distFade * waveFade;
      mesh.visible = true;
    }
  }
}
