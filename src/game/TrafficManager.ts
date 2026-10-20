/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CollisionBox } from './WorldBuilder';

export interface TrafficCar {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  heading: number;
  speed: number;
  maxSpeed: number;
  waypoints: THREE.Vector3[];
  wpIndex: number;
  type: 'car' | 'truck' | 'rickshaw' | 'police';
  sirenLights?: THREE.PointLight[];
}

export class TrafficManager {
  private traffic: TrafficCar[] = [];
  public root: THREE.Group;
  private collisionBoxes: CollisionBox[];
  public policeCruiser: TrafficCar | null = null;
  public isPolicePursuing: boolean = false;

  constructor(sceneRoot: THREE.Object3D, collisionBoxes: CollisionBox[]) {
    this.root = new THREE.Group();
    this.root.name = 'Traffic_Root';
    sceneRoot.add(this.root);
    this.collisionBoxes = collisionBoxes;

    this.spawnTraffic();
  }

  private createRickshaw(): THREE.Group {
    const rick = new THREE.Group();
    // Yellow & Green Indian Auto-Rickshaw
    const bodyGeo = new THREE.BoxGeometry(1.3, 1.2, 2.2);
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.4 });
    const greenMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.6 });
    const blackMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 });

    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 2.2), greenMat);
    lower.position.y = 0.5;
    rick.add(lower);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.6, 2.0), yellowMat);
    roof.position.y = 1.1;
    rick.add(roof);

    // 3 small wheels
    const wFront = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8).rotateZ(Math.PI / 2), blackMat);
    wFront.position.set(0, 0.25, 0.85);
    const wBackL = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8).rotateZ(Math.PI / 2), blackMat);
    wBackL.position.set(-0.6, 0.25, -0.65);
    const wBackR = wBackL.clone();
    wBackR.position.x = 0.6;
    rick.add(wFront, wBackL, wBackR);

    // Headlight
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fef08a' }));
    hl.position.set(0, 0.6, 1.12);
    rick.add(hl);

    return rick;
  }

  private createCivilianCar(color: string): THREE.Group {
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1 });
    const tireMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 3.8), bodyMat);
    body.position.y = 0.55;
    car.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2.0), glassMat);
    cabin.position.set(0, 1.05, -0.2);
    car.add(cabin);

    // 4 wheels
    for (let x of [-0.85, 0.85]) {
      for (let z of [-1.1, 1.1]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 10).rotateZ(Math.PI / 2), tireMat);
        w.position.set(x, 0.34, z);
        car.add(w);
      }
    }
    return car;
  }

  private createPoliceCar(): { mesh: THREE.Group; lights: THREE.PointLight[] } {
    const car = this.createCivilianCar('#f8fafc');
    // Indian Police blue/red stripes
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.15, 3.8), new THREE.MeshStandardMaterial({ color: '#1e3a8a' }));
    stripe.position.y = 0.65;
    car.add(stripe);

    // Roof lightbar
    const barGeo = new THREE.BoxGeometry(0.8, 0.15, 0.3);
    const bar = new THREE.Mesh(barGeo, new THREE.MeshStandardMaterial({ color: '#18181b' }));
    bar.position.set(0, 1.38, -0.2);
    car.add(bar);

    const redLight = new THREE.PointLight(0xff0000, 0, 15);
    redLight.position.set(-0.35, 1.48, -0.2);
    car.add(redLight);

    const blueLight = new THREE.PointLight(0x0066ff, 0, 15);
    blueLight.position.set(0.35, 1.48, -0.2);
    car.add(blueLight);

    return { mesh: car, lights: [redLight, blueLight] };
  }

  private spawnTraffic() {
    // 1. Highway Waypoint Loop (runs back and forth between Village and City on correct lanes)
    const highwayUpLane = [
      new THREE.Vector3(-260, 0, -260),
      new THREE.Vector3(-150, 0, -150),
      new THREE.Vector3(-25, 0, -25),
      new THREE.Vector3(120, 0, 120),
      new THREE.Vector3(260, 0, 260),
    ];

    const highwayDownLane = [
      new THREE.Vector3(265, 0, 255),
      new THREE.Vector3(115, 0, 125),
      new THREE.Vector3(-15, 0, -5),
      new THREE.Vector3(-145, 0, -135),
      new THREE.Vector3(-255, 0, -245),
    ];

    // City Ring Circuit
    const cityLoop = [
      new THREE.Vector3(220, 0, 180),
      new THREE.Vector3(300, 0, 180),
      new THREE.Vector3(300, 0, 260),
      new THREE.Vector3(220, 0, 260),
    ];

    // Spawn 8 highway cars
    const colors = ['#dc2626', '#ffffff', '#2563eb', '#ca8a04', '#475569', '#16a34a'];
    for (let i = 0; i < 4; i++) {
      const mesh = this.createCivilianCar(colors[i % colors.length]);
      const startWp = Math.floor(Math.random() * (highwayUpLane.length - 1));
      const pos = highwayUpLane[startWp].clone();
      this.root.add(mesh);
      this.traffic.push({
        mesh,
        pos,
        heading: Math.PI / 4,
        speed: 12 + Math.random() * 6,
        maxSpeed: 18,
        waypoints: highwayUpLane,
        wpIndex: (startWp + 1) % highwayUpLane.length,
        type: 'car',
      });
    }

    for (let i = 0; i < 4; i++) {
      const mesh = this.createCivilianCar(colors[(i + 3) % colors.length]);
      const startWp = Math.floor(Math.random() * (highwayDownLane.length - 1));
      const pos = highwayDownLane[startWp].clone();
      this.root.add(mesh);
      this.traffic.push({
        mesh,
        pos,
        heading: -3 * Math.PI / 4,
        speed: 12 + Math.random() * 6,
        maxSpeed: 18,
        waypoints: highwayDownLane,
        wpIndex: (startWp + 1) % highwayDownLane.length,
        type: 'car',
      });
    }

    // Spawn 3 Indian Auto-Rickshaws in City / Village border
    for (let i = 0; i < 3; i++) {
      const mesh = this.createRickshaw();
      this.root.add(mesh);
      this.traffic.push({
        mesh,
        pos: cityLoop[i % cityLoop.length].clone(),
        heading: 0,
        speed: 8 + Math.random() * 4,
        maxSpeed: 12,
        waypoints: cityLoop,
        wpIndex: (i + 1) % cityLoop.length,
        type: 'rickshaw',
      });
    }

    // Spawn Police Patrol Cruiser
    const police = this.createPoliceCar();
    this.root.add(police.mesh);
    this.policeCruiser = {
      mesh: police.mesh,
      pos: new THREE.Vector3(5, 0, 15),
      heading: Math.PI / 4,
      speed: 14,
      maxSpeed: 25,
      waypoints: highwayUpLane,
      wpIndex: 2,
      type: 'police',
      sirenLights: police.lights,
    };
    this.traffic.push(this.policeCruiser);
  }

  public update(delta: number, playerPos: THREE.Vector3, onTrafficHit?: () => void) {
    const flashTime = (Date.now() / 150) % 2;

    this.traffic.forEach((car) => {
      // 1. Follow waypoints
      let targetWp = car.waypoints[car.wpIndex];

      // If police is in pursuit, chase player!
      if (car.type === 'police' && this.isPolicePursuing) {
        targetWp = playerPos;
        car.speed = THREE.MathUtils.damp(car.speed, car.maxSpeed, 4, delta);

        // Flash police siren lights
        if (car.sirenLights) {
          car.sirenLights[0].intensity = flashTime < 1 ? 25 : 0;
          car.sirenLights[1].intensity = flashTime >= 1 ? 25 : 0;
        }
      } else if (car.type === 'police' && car.sirenLights) {
        car.sirenLights[0].intensity = 0;
        car.sirenLights[1].intensity = 0;
      }

      const dx = targetWp.x - car.pos.x;
      const dz = targetWp.z - car.pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 5 && car.type !== 'police') {
        car.wpIndex = (car.wpIndex + 1) % car.waypoints.length;
      } else {
        const targetHeading = Math.atan2(dx, dz);
        car.heading = THREE.MathUtils.damp(car.heading, targetHeading, 3.5, delta);

        // Check if player car is right ahead; brake if too close
        const distToPlayer = car.pos.distanceTo(playerPos);
        let moveSpeed = car.speed;
        if (distToPlayer < 8 && !this.isPolicePursuing) {
          moveSpeed = Math.max(0, car.speed * 0.2);
        }

        // Move
        const forward = new THREE.Vector3(Math.sin(car.heading), 0, Math.cos(car.heading));
        car.pos.addScaledVector(forward, moveSpeed * delta);
        car.mesh.position.copy(car.pos);
        car.mesh.rotation.y = car.heading;

        // Player collision check
        if (distToPlayer < 2.4 && onTrafficHit) {
          onTrafficHit();
        }
      }
    });
  }

  public setPolicePursuit(active: boolean) {
    this.isPolicePursuing = active;
  }
}
