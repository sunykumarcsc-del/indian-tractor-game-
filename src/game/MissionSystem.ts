/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Mission } from '../types/game';
import { soundManager } from '../audio/SoundManager';

export const MISSIONS_LIST: Mission[] = [
  {
    id: 'm1_harvest',
    title: 'Village Harvest Supply',
    subtitle: 'गाँव की फसल मंडी पहुँचाओ',
    description: 'Transport fresh sugarcane and grain sacks from Rampur village granary to the Metro City wholesale market.',
    reward: 1500,
    startPos: [-240, 0, -220],
    targetPos: [260, 0, 220],
    targetRadius: 16,
    targetName: 'Metro City Wholesale Mandi',
    icon: 'Wheat',
  },
  {
    id: 'm2_taxi',
    title: 'City Airport Taxi',
    subtitle: 'यात्री को हवाई अड्डे छोड़ो',
    description: 'Pick up an urgent business passenger in City Center and rush them to Bharatpur Airport departures.',
    reward: 2200,
    startPos: [260, 0, 220],
    targetPos: [-220, 0, 260],
    targetRadius: 18,
    targetName: 'Bharatpur Airport Terminal',
    timeLimit: 110,
    icon: 'Car',
  },
  {
    id: 'm3_cargo',
    title: 'Air Cargo Express Delivery',
    subtitle: 'विमान कार्गो हैंगर पहुँचाओ',
    description: 'Deliver emergency aircraft replacement parts directly to the airport runway cargo hangar before takeoff.',
    reward: 3000,
    startPos: [80, 0, 70],
    targetPos: [-192, 0, 340],
    targetRadius: 15,
    targetName: 'Runway Cargo Hangar',
    timeLimit: 95,
    icon: 'Plane',
  },
  {
    id: 'm4_toll',
    title: 'Highway Toll Crossing',
    subtitle: 'हाईवे टोल प्लाज़ा पार करो',
    description: 'Drive along the NH-44 highway and cross through the toll plaza barrier safely.',
    reward: 1200,
    startPos: [-120, 0, -110],
    targetPos: [-20, 0, -10],
    targetRadius: 14,
    targetName: 'NH-44 Toll Plaza',
    icon: 'CreditCard',
  },
  {
    id: 'm5_parking',
    title: 'Precision Station Parking',
    subtitle: 'पेट्रोल पंप बे में पार्क करो',
    description: 'Park your vehicle smoothly inside the marked service garage bay at Indian Oil Petrol Station.',
    reward: 1000,
    startPos: [-20, 0, -10],
    targetPos: [85, 0, 52],
    targetRadius: 7,
    targetName: 'Petrol Station Service Bay',
    icon: 'SquareParking',
  },
  {
    id: 'm6_sprint',
    title: 'Grand Village-City Sprint',
    subtitle: 'गाँव से शहर रेस स्प्रिंट',
    description: 'High-speed open highway sprint challenge! Race from Rampur Temple to Metro City Tower in record time.',
    reward: 3500,
    startPos: [-290, 0, -280],
    targetPos: [315, 0, 275],
    targetRadius: 18,
    targetName: 'City Apex Tower',
    timeLimit: 85,
    icon: 'Zap',
  },
  {
    id: 'm7_milk',
    title: 'Village Milk Dairy Run',
    subtitle: 'ताज़ा दूध संग्रह केंद्र पहुँचाओ',
    description: 'Collect fresh morning milk cans from the farm pastures and deliver to Sher-e-Punjab Dhaba.',
    reward: 1800,
    startPos: [-210, 0, -100],
    targetPos: [-120, 0, -110],
    targetRadius: 15,
    targetName: 'Sher-e-Punjab Dhaba',
    icon: 'Milk',
  },
  {
    id: 'm8_plow',
    title: 'Village Field Plowing',
    subtitle: 'खेत की जुताई करो (Cultivator Hal)',
    description: 'Hitch the DELEKS spring cultivator (हल) to your tractor and drive across the Rampur farm field to plow 80%+ of the soil!',
    reward: 6500,
    startPos: [-240, 0, -220],
    targetPos: [-210, 0, -100],
    targetRadius: 44,
    targetName: 'Rampur Krishi Farm Field (खेत)',
    icon: 'Tractor',
  },
];

export class MissionSystem {
  public activeMission: Mission | null = null;
  public remainingTime: number = 0;
  public beaconMesh: THREE.Group;
  private ringMesh: THREE.Mesh;
  private beamMesh: THREE.Mesh;
  private sceneRoot: THREE.Object3D;
  private onCompleteCallback?: (reward: number, mission: Mission) => void;
  private onFailCallback?: (reason: string) => void;

  constructor(sceneRoot: THREE.Object3D) {
    this.sceneRoot = sceneRoot;

    // Build 3D glowing beacon marker
    this.beaconMesh = new THREE.Group();
    this.beaconMesh.visible = false;

    // Glowing ground ring
    const ringGeo = new THREE.RingGeometry(2, 6, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#facc15',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.position.y = 0.15;
    this.beaconMesh.add(this.ringMesh);

    // Glowing vertical skybeam
    const beamGeo = new THREE.CylinderGeometry(0.8, 3.2, 80, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: '#fbbf24',
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.beamMesh.position.y = 40;
    this.beaconMesh.add(this.beamMesh);

    this.sceneRoot.add(this.beaconMesh);
  }

  public setCallbacks(
    onComplete: (reward: number, mission: Mission) => void,
    onFail: (reason: string) => void
  ) {
    this.onCompleteCallback = onComplete;
    this.onFailCallback = onFail;
  }

  public startMission(mission: Mission, playerSetPos?: (x: number, y: number, z: number) => void) {
    this.activeMission = mission;
    this.remainingTime = mission.timeLimit || 0;

    // If starting position provided and requested, teleport or mark waypoint
    if (playerSetPos) {
      playerSetPos(mission.startPos[0], mission.startPos[1], mission.startPos[2]);
    }

    // Position beacon at target
    this.beaconMesh.position.set(mission.targetPos[0], mission.targetPos[1], mission.targetPos[2]);
    this.beaconMesh.visible = true;

    soundManager.playClick();
  }

  public cancelMission() {
    this.activeMission = null;
    this.beaconMesh.visible = false;
  }

  public update(delta: number, playerPos: THREE.Vector3, playerSpeedKmH: number) {
    if (!this.activeMission) return;

    // Animate beacon rotation and pulse
    this.ringMesh.rotation.y += delta * 1.5;
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
    this.ringMesh.scale.set(pulse, 1, pulse);

    // Handle timer countdown
    if (this.activeMission.timeLimit) {
      this.remainingTime -= delta;
      if (this.remainingTime <= 0) {
        // Mission failed due to time
        const m = this.activeMission;
        this.activeMission = null;
        this.beaconMesh.visible = false;
        if (this.onFailCallback) {
          this.onFailCallback(`Time Ran Out for "${m.title}"!`);
        }
        return;
      }
    }

    // Distance to target
    const targetVec = new THREE.Vector3(
      this.activeMission.targetPos[0],
      this.activeMission.targetPos[1],
      this.activeMission.targetPos[2]
    );
    const dist = playerPos.distanceTo(targetVec);

    // Check completion criteria: inside radius and stopped/slowed down
    if (this.activeMission.id !== 'm8_plow') {
      if (dist <= this.activeMission.targetRadius && Math.abs(playerSpeedKmH) < 22) {
        const completedMission = this.activeMission;
        this.activeMission = null;
        this.beaconMesh.visible = false;

        soundManager.playReward();
        if (this.onCompleteCallback) {
          this.onCompleteCallback(completedMission.reward, completedMission);
        }
      }
    } else {
      // For plowing mission, once the player is inside the farm field, hide the vertical skybeam so they can see the soil clearly
      if (dist <= this.activeMission.targetRadius) {
        this.beaconMesh.visible = false;
      } else {
        this.beaconMesh.visible = true;
      }
    }
  }

  public completeActiveMission() {
    if (!this.activeMission) return;
    const completedMission = this.activeMission;
    this.activeMission = null;
    this.beaconMesh.visible = false;
    soundManager.playReward();
    if (this.onCompleteCallback) {
      this.onCompleteCallback(completedMission.reward, completedMission);
    }
  }

  public getDistanceToTarget(playerPos: THREE.Vector3): number {
    if (!this.activeMission) return 0;
    const targetVec = new THREE.Vector3(
      this.activeMission.targetPos[0],
      this.activeMission.targetPos[1],
      this.activeMission.targetPos[2]
    );
    return Math.round(playerPos.distanceTo(targetVec));
  }
}
