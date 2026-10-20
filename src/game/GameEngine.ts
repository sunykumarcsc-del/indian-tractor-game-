/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraMode, InputState, TimeOfDay, VehicleConfig, VehicleType } from '../types/game';
import { buildOpenWorld, WorldData } from './WorldBuilder';
import { buildVehicleRig, VehicleRig, VEHICLE_CONFIGS } from './VehicleFactory';
import { PhysicsEngine } from './PhysicsEngine';
import { TrafficManager } from './TrafficManager';
import { MissionSystem } from './MissionSystem';
import { soundManager } from '../audio/SoundManager';
import { PlowingSystem, PlowingStatus } from './PlowingSystem';
import { RoadNavigator } from './RoadNavigator';

export interface GameEngineCallbacks {
  onSpeedUpdate: (speedKmH: number, gear: string) => void;
  onTollDeduction: (amount: number, status: string) => void;
  onPoliceAlert: (fine: number, reason: string) => void;
  onMissionComplete: (reward: number, title: string) => void;
  onMissionFail: (reason: string) => void;
  onPlayerPosUpdate: (x: number, z: number, heading: number) => void;
  onPlowingUpdate?: (status: PlowingStatus) => void;
  onRoadUpdate?: (roadInfo: { name: string; hindiName: string; type: string }) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  private world: WorldData;
  private vehicleRig!: VehicleRig;
  private physics!: PhysicsEngine;
  private traffic!: TrafficManager;
  public missions!: MissionSystem;
  public plowing!: PlowingSystem;
  public navigator!: RoadNavigator;

  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  private cameraMode: CameraMode = 'chase';
  private timeOfDay: TimeOfDay = 'day';
  private callbacks: GameEngineCallbacks;

  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  public isShowcaseMode: boolean = false;

  // Particle systems
  private exhaustParticles: { mesh: THREE.Mesh; life: number; maxLife: number; vel: THREE.Vector3 }[] = [];
  private particleGroup: THREE.Group;

  // Toll state
  private tollCrossedRecently: boolean = false;

  // Police cooldown
  private policeCooldownTimer: number = 0;
  private lastOverspeedWarning: number = 0;

  // Reusable camera vectors (Zero GC inside render loop)
  private _camTarget = new THREE.Vector3();
  private _camPos = new THREE.Vector3();

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene & Renderer setup (per threejs skill directives)
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.3, 1200);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Studio Environment map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 2. Lighting Rig
    this.setupLighting();

    // 3. Build 3D Open World
    this.world = buildOpenWorld();
    this.scene.add(this.world.root);

    // 4. Particle systems
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    // 5. Initialize Vehicle Rig & Physics (Default to tractor or first vehicle)
    this.spawnVehicle('tractor');

    // 6. Traffic & Police
    this.traffic = new TrafficManager(this.scene, this.world.collisionBoxes);

    // 7. Missions
    this.missions = new MissionSystem(this.scene);
    this.missions.setCallbacks(
      (reward, mission) => {
        this.callbacks.onMissionComplete(reward, mission.title);
      },
      (reason) => {
        this.callbacks.onMissionFail(reason);
      }
    );

    // 8. Interactive Field Plowing System
    this.plowing = new PlowingSystem(this.scene);
    this.plowing.setOnComplete((reward, msg) => {
      this.callbacks.onMissionComplete(reward, msg);
    });

    // 9. 3D Road Chevron Navigation System
    this.navigator = new RoadNavigator(this.scene);

    // Window resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Start loop
    this.start();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x3f3f46, 0.9);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    this.dirLight.position.set(120, 180, 100);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 450;
    const d = 110;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    this.applyTimeOfDay('day');
  }

  public applyTimeOfDay(tod: TimeOfDay) {
    this.timeOfDay = tod;
    if (tod === 'day') {
      this.scene.background = new THREE.Color('#7dd3fc'); // Indian sunny azure sky
      this.scene.fog = new THREE.FogExp2('#bae6fd', 0.0018);
      this.hemiLight.color.set('#dbeafe');
      this.hemiLight.groundColor.set('#4b5563');
      this.hemiLight.intensity = 1.0;
      this.dirLight.color.set('#fffbeb');
      this.dirLight.intensity = 2.2;
      this.dirLight.position.set(120, 180, 100);
      if (this.vehicleRig) this.vehicleRig.setHeadlights(false);
    } else if (tod === 'sunset') {
      this.scene.background = new THREE.Color('#fdba74'); // Warm golden sunset
      this.scene.fog = new THREE.FogExp2('#fed7aa', 0.0022);
      this.hemiLight.color.set('#fed7aa');
      this.hemiLight.groundColor.set('#78350f');
      this.hemiLight.intensity = 0.85;
      this.dirLight.color.set('#f97316');
      this.dirLight.intensity = 1.8;
      this.dirLight.position.set(180, 60, 120);
      if (this.vehicleRig) this.vehicleRig.setHeadlights(true);
    } else if (tod === 'night') {
      this.scene.background = new THREE.Color('#090d16'); // Deep starry indigo night
      this.scene.fog = new THREE.FogExp2('#0f172a', 0.0028);
      this.hemiLight.color.set('#1e293b');
      this.hemiLight.groundColor.set('#020617');
      this.hemiLight.intensity = 0.35;
      this.dirLight.color.set('#38bdf8'); // Moonlight
      this.dirLight.intensity = 0.45;
      this.dirLight.position.set(-80, 140, -60);
      if (this.vehicleRig) this.vehicleRig.setHeadlights(true);
    }
  }

  public spawnVehicle(type: VehicleType, customColor?: string, mods?: import('../types/game').TractorModSettings) {
    const config = VEHICLE_CONFIGS[type];
    const prevPos = this.physics ? this.physics.getState().pos.clone() : new THREE.Vector3(-240, 0.5, -220);
    const prevHeading = this.physics ? this.physics.getState().heading : 0;

    // Remove old vehicle mesh
    if (this.vehicleRig) {
      this.scene.remove(this.vehicleRig.group);
    }

    this.vehicleRig = buildVehicleRig(config, customColor, mods);
    this.scene.add(this.vehicleRig.group);

    if (this.physics) {
      this.physics.setRig(this.vehicleRig);
      this.physics.setPosition(prevPos.x, prevPos.y, prevPos.z, prevHeading);
    } else {
      this.physics = new PhysicsEngine(this.vehicleRig, prevPos, this.world.collisionBoxes);
      this.physics.setPosition(prevPos.x, prevPos.y, prevPos.z, prevHeading);
      this.physics.setCollisionCallback((hitSpeed) => {
        // High speed collision warning
        if (hitSpeed > 45) {
          this.triggerPoliceAlert(250, 'Dangerous Collision / Accident');
        }
      });
    }

    if (this.timeOfDay === 'night' || this.timeOfDay === 'sunset') {
      this.vehicleRig.setHeadlights(true);
    }
  }

  public updateTractorMods(mods: import('../types/game').TractorModSettings) {
    if (this.vehicleRig && this.vehicleRig.updateModifications) {
      this.vehicleRig.updateModifications(mods);
    }
  }

  public getVehicleRig(): VehicleRig {
    return this.vehicleRig;
  }

  public setVehicleColor(color: string) {
    if (this.vehicleRig) {
      this.vehicleRig.updateColor(color);
    }
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public teleport(x: number, y: number, z: number, heading: number = 0) {
    if (this.physics) {
      this.physics.setPosition(x, y, z, heading);
    }
  }

  private triggerPoliceAlert(fine: number, reason: string) {
    soundManager.startPoliceSiren();
    this.traffic.setPolicePursuit(true);
    this.policeCooldownTimer = 12; // 12 seconds pursuit
    this.callbacks.onPoliceAlert(fine, reason);
  }

  // Particle Spawner
  private spawnExhaustParticle(pos: THREE.Vector3, isDirt: boolean = false) {
    if (this.exhaustParticles.length > 40) return;

    const isTractor = this.vehicleRig?.config.isTractor;
    const pColor = isDirt ? '#a16207' : isTractor ? '#18181b' : '#94a3b8';
    const pSize = isDirt ? 0.35 : isTractor ? 0.26 : 0.18;

    const geo = new THREE.SphereGeometry(pSize, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: pColor,
      transparent: true,
      opacity: isTractor ? 0.8 : 0.6,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.particleGroup.add(mesh);

    this.exhaustParticles.push({
      mesh,
      life: 0,
      maxLife: isDirt ? 0.6 : isTractor ? 1.2 : 0.9,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (isTractor ? 0.7 : 0.4) + Math.random() * 0.6,
        (Math.random() - 0.5) * 0.4
      ),
    });
  }

  // Plowing Soil Clod & Dust Spawner
  public spawnSoilParticle(pos: THREE.Vector3) {
    if (this.exhaustParticles.length > 55) return;

    // Dark fertile brown soil clod
    const soilColors = ['#2d1810', '#3e2723', '#4a2c11', '#5d4037'];
    const pColor = soilColors[Math.floor(Math.random() * soilColors.length)];
    const pSize = 0.2 + Math.random() * 0.25;

    const geo = new THREE.DodecahedronGeometry(pSize, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: pColor,
      roughness: 0.95,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    // Random offset across tines width
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 2.2,
      pos.y + 0.15 + Math.random() * 0.2,
      pos.z + (Math.random() - 0.5) * 2.2
    );
    this.particleGroup.add(mesh);

    this.exhaustParticles.push({
      mesh,
      life: 0,
      maxLife: 0.8 + Math.random() * 0.4,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        1.2 + Math.random() * 1.4, // flying up from tiller tines
        (Math.random() - 0.5) * 1.5
      ),
    });
  }

  private updateParticles(delta: number) {
    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      const p = this.exhaustParticles[i];
      p.life += delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      const scale = 1 + (p.life / p.maxLife) * 2.5;
      p.mesh.scale.set(scale, scale, scale);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.exhaustParticles.splice(i, 1);
      }
    }
  }

  public update(delta: number, input: InputState, playerMoney: number) {
    if (!this.physics || !this.vehicleRig) return;

    // Showcase Turntable mode (used in Main Menu & Garage)
    if (this.isShowcaseMode) {
      const time = Date.now() * 0.0008;
      const dist = this.vehicleRig.trolleyGroup ? 10.5 : 7.5;
      this.camera.position.set(Math.cos(time) * dist, 2.8, Math.sin(time) * dist);
      this.camera.lookAt(0, 1.2, 0);
      this.vehicleRig.group.position.set(0, 0, 0);
      this.vehicleRig.group.rotation.set(0, 0, 0);
      return;
    }

    // 1. Physics Step
    this.physics.update(delta, input, this.world.getTerrainHeight);
    const pState = this.physics.getState();

    // 2. Audio Engine update
    soundManager.updateEngine(
      pState.speedKmH,
      this.vehicleRig.config.maxSpeed,
      input.throttle,
      this.vehicleRig.config.hornType
    );

    // Horn trigger
    if (input.horn) {
      soundManager.startHorn(this.vehicleRig.config.hornType);
    } else {
      soundManager.stopHorn();
    }

    // Headlights toggle
    if (input.headlights) {
      this.vehicleRig.setHeadlights(true);
    }

    // DJ Bass Pulse Animation
    if (this.vehicleRig.speakerMeshes && this.vehicleRig.speakerMeshes.length > 0 && soundManager.isDJPlaying()) {
      const bassPulse = 1 + Math.sin(Date.now() * 0.025) * 0.06;
      this.vehicleRig.speakerMeshes.forEach((spk) => {
        spk.scale.set(bassPulse, bassPulse, 1);
      });
    }

    // 3. World updates (animated toll barriers, pedestrians, traffic lights)
    this.world.update(delta);

    // 4. AI Traffic update
    this.traffic.update(delta, pState.pos, () => {
      // Traffic collision fine!
      this.triggerPoliceAlert(400, 'Reckless Traffic Collision!');
    });

    // 5. Missions update
    this.missions.update(delta, pState.pos, pState.speedKmH);

    // 5a. 3D Road Chevron Navigation Update
    if (this.missions.activeMission) {
      this.navigator.setTarget(this.missions.activeMission.targetPos);
    } else {
      this.navigator.setTarget(null);
    }
    this.navigator.update(delta, pState.pos, pState.heading);

    // 5b. Interactive Field Plowing System update
    const plowingStatus = this.plowing.update(
      pState.pos,
      this.vehicleRig?.currentTrolley,
      pState.speedKmH,
      pState.heading,
      delta
    );

    if (this.callbacks.onPlowingUpdate) {
      this.callbacks.onPlowingUpdate(plowingStatus);
    }

    // Spawn rich flying earth particles from tiller tines when cultivating
    if (plowingStatus.isPlowing) {
      const tinesPos = pState.pos.clone().sub(
        new THREE.Vector3(Math.sin(pState.heading) * 2.4, -0.1, Math.cos(pState.heading) * 2.4)
      );
      this.spawnSoilParticle(tinesPos);
    }

    // If plowing mission is active and field plowing is completed, complete the mission!
    if (plowingStatus.justCompleted && this.missions.activeMission?.id === 'm8_plow') {
      this.missions.completeActiveMission();
    }

    // 5c. Current Road update callback
    if (this.callbacks.onRoadUpdate) {
      const roadInfo = this.navigator.getNearestRoadName(pState.pos.x, pState.pos.z);
      this.callbacks.onRoadUpdate(roadInfo);
    }

    // 6. Highway Toll System check
    // Toll Plaza center is at (-20, 0, -10)
    const distToToll = Math.hypot(pState.pos.x - (-20), pState.pos.z - (-10));
    if (distToToll < 14) {
      if (!this.tollCrossedRecently) {
        if (playerMoney >= 50) {
          this.tollCrossedRecently = true;
          this.world.tollGate.isOpen = true;
          soundManager.playTollChime();
          this.callbacks.onTollDeduction(50, 'Toll Paid ₹50. Barrier Opened!');
        } else {
          // Insufficient money!
          this.world.tollGate.isOpen = false;
          this.callbacks.onTollDeduction(0, 'Insufficient Money! ₹50 Required to Pass Toll.');
          // Barrier is closed, collision will stop them
        }
      }
    } else if (distToToll > 28) {
      // Reset toll crossing once vehicle is safely past
      this.tollCrossedRecently = false;
      this.world.tollGate.isOpen = false;
    }

    // 7. Police & Violation System
    // Check speed limit in Village zone (speed > 85 km/h in village is a violation)
    const isInVillage = pState.pos.x < -160 && pState.pos.z < -160;
    if (isInVillage && Math.abs(pState.speedKmH) > 85 && Date.now() - this.lastOverspeedWarning > 10000) {
      this.lastOverspeedWarning = Date.now();
      this.triggerPoliceAlert(300, 'Overspeeding in Village Zone (85+ km/h)');
    }

    // Police pursuit cooldown
    if (this.policeCooldownTimer > 0) {
      this.policeCooldownTimer -= delta;
      if (this.policeCooldownTimer <= 0) {
        soundManager.stopPoliceSiren();
        this.traffic.setPolicePursuit(false);
      }
    }

    // 8. Particle Spawns
    if (Math.abs(input.throttle) > 0.08 || pState.isDrifting || Math.abs(pState.speedKmH) > 5) {
      const worldExhaust = this.vehicleRig.exhaustPos.clone().applyMatrix4(this.vehicleRig.group.matrixWorld);
      this.spawnExhaustParticle(worldExhaust, false);

      // Dust when on village dirt road
      if (isInVillage && Math.abs(pState.speedKmH) > 15) {
        this.spawnExhaustParticle(pState.pos.clone().add(new THREE.Vector3(0, 0.2, 0)), true);
      }
    }
    this.updateParticles(delta);

    // 9. Camera Following
    this.updateCamera(delta, pState);

    // 10. Update HUD data callbacks
    const gear = pState.speedKmH < -0.5 ? 'R' : Math.abs(pState.speedKmH) < 0.5 ? 'N' : 'D';
    this.callbacks.onSpeedUpdate(Math.round(Math.abs(pState.speedKmH)), gear);
    this.callbacks.onPlayerPosUpdate(pState.pos.x, pState.pos.z, pState.heading);

    // DirLight follows vehicle position for crisp shadows
    this.dirLight.position.set(pState.pos.x + 80, 140, pState.pos.z + 70);
    this.dirLight.target.position.copy(pState.pos);
    this.dirLight.target.updateMatrixWorld();
  }

  private updateCamera(delta: number, pState: ReturnType<PhysicsEngine['getState']>) {
    const heading = pState.heading;

    if (this.cameraMode === 'chase') {
      // Third-person chase camera (elongated if trailer is hitched)
      const hasTrolley = !!this.vehicleRig.trolleyGroup;
      const backDist = hasTrolley ? 10.8 : this.vehicleRig.config.length * 1.6 + 3.8;
      const height = hasTrolley ? 4.5 : this.vehicleRig.config.height * 1.3 + 2.0;

      const targetCamX = pState.pos.x - Math.sin(heading) * backDist;
      const targetCamZ = pState.pos.z - Math.cos(heading) * backDist;
      const targetCamY = pState.pos.y + height;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 7, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 7, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 7, delta);

      const targetLookZ = hasTrolley ? pState.pos.z - Math.cos(heading) * 1.8 : pState.pos.z;
      const targetLookX = hasTrolley ? pState.pos.x - Math.sin(heading) * 1.8 : pState.pos.x;
      this._camTarget.set(targetLookX, pState.pos.y + 1.2, targetLookZ);
      this.camera.lookAt(this._camTarget);


    } else if (this.cameraMode === 'hood') {
      // First-person bonnet / driver POV
      const hoodX = pState.pos.x + Math.sin(heading) * (this.vehicleRig.config.length * 0.35);
      const hoodZ = pState.pos.z + Math.cos(heading) * (this.vehicleRig.config.length * 0.35);
      const hoodY = pState.pos.y + this.vehicleRig.config.height * 0.85;

      this.camera.position.set(hoodX, hoodY, hoodZ);

      const lookAhead = 25;
      this._camTarget.set(
        pState.pos.x + Math.sin(heading) * lookAhead,
        pState.pos.y + this.vehicleRig.config.height * 0.8,
        pState.pos.z + Math.cos(heading) * lookAhead
      );
      this.camera.lookAt(this._camTarget);

    } else if (this.cameraMode === 'top') {
      // Top-down helicopter / drone camera
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, pState.pos.x, 6, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, pState.pos.y + 36, 6, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, pState.pos.z, 6, delta);
      this.camera.lookAt(pState.pos.x, pState.pos.y, pState.pos.z);

    } else if (this.cameraMode === 'cinematic') {
      // Dynamic orbit angle
      const time = Date.now() * 0.0012;
      const orbitDist = 9.0;
      this.camera.position.set(
        pState.pos.x + Math.cos(time) * orbitDist,
        pState.pos.y + 3.5,
        pState.pos.z + Math.sin(time) * orbitDist
      );
      this.camera.lookAt(pState.pos.x, pState.pos.y + 1.2, pState.pos.z);
    }
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();

    const loop = () => {
      if (!this.isRunning) return;
      const delta = Math.min(this.clock.getDelta(), 0.05);
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    soundManager.stopEngine();
    soundManager.stopHorn();
    soundManager.stopPoliceSiren();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
