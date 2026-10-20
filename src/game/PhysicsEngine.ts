/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { InputState } from '../types/game';
import { VehicleRig } from './VehicleFactory';
import { CollisionBox } from './WorldBuilder';
import { soundManager } from '../audio/SoundManager';

export interface VehiclePhysicsState {
  pos: THREE.Vector3;
  velocity: THREE.Vector3;
  speedKmH: number;
  heading: number; // yaw in radians
  steerAngle: number;
  pitch: number;
  roll: number;
  isGrounded: boolean;
  isDrifting: boolean;
  isColliding: boolean;
  lastCollisionTime: number;
}

export class PhysicsEngine {
  private rig: VehicleRig;
  private state: VehiclePhysicsState;
  private collisionBoxes: CollisionBox[];
  private onCrashCallback?: (speed: number) => void;

  // Reusable math scratchpads (Zero GC inside render tick)
  private static _forward = new THREE.Vector3();
  private static _up = new THREE.Vector3(0, 1, 0);

  constructor(rig: VehicleRig, initialPos: THREE.Vector3, collisionBoxes: CollisionBox[]) {
    this.rig = rig;
    this.collisionBoxes = collisionBoxes;
    this.state = {
      pos: initialPos.clone(),
      velocity: new THREE.Vector3(),
      speedKmH: 0,
      heading: 0,
      steerAngle: 0,
      pitch: 0,
      roll: 0,
      isGrounded: true,
      isDrifting: false,
      isColliding: false,
      lastCollisionTime: 0,
    };
    this.rig.group.position.copy(this.state.pos);
  }

  public setRig(newRig: VehicleRig) {
    this.rig = newRig;
    this.rig.group.position.copy(this.state.pos);
    this.rig.group.rotation.y = this.state.heading;
  }

  public setCollisionCallback(cb: (speed: number) => void) {
    this.onCrashCallback = cb;
  }

  public getState(): VehiclePhysicsState {
    return this.state;
  }

  public setPosition(x: number, y: number, z: number, heading: number = 0) {
    this.state.pos.set(x, y, z);
    this.state.velocity.set(0, 0, 0);
    this.state.speedKmH = 0;
    this.state.heading = heading;
    this.state.steerAngle = 0;
    this.rig.trolleyHeading = heading;
    this.rig.group.position.copy(this.state.pos);
    this.rig.group.rotation.set(0, heading, 0);
    if (this.rig.trolleyGroup) {
      this.rig.trolleyGroup.rotation.y = 0;
    }
  }

  public update(delta: number, input: InputState, getTerrainHeight: (x: number, z: number) => number) {
    const config = this.rig.config;
    // Upgrade multiplier bonuses
    const engineBoost = 1 + config.upgrades.engine * 0.12;
    const brakeBoost = 1 + config.upgrades.brakes * 0.15;
    const handlingBoost = 1 + config.upgrades.handling * 0.1;

    const maxSpeedMs = (config.maxSpeed * engineBoost) / 3.6; // convert km/h to m/s
    const accelRate = config.acceleration * engineBoost;
    const brakeRate = config.brakeForce * brakeBoost;

    // 1. Steering Dynamics
    // Steer angle reduces slightly at high speed for stable highway cruising
    const currentSpeed = this.state.velocity.length();
    const speedFactor = Math.max(0.35, 1 - (currentSpeed / maxSpeedMs) * 0.65);
    const targetSteer = input.steer * 0.58 * speedFactor * handlingBoost;
    this.state.steerAngle = THREE.MathUtils.damp(this.state.steerAngle, targetSteer, 8.0, delta);

    // Front wheels visual steer rotation
    this.rig.frontWheels.forEach((w) => {
      w.rotation.y = this.state.steerAngle;
    });

    // 2. Acceleration / Braking along Heading Vector
    PhysicsEngine._forward.set(Math.sin(this.state.heading), 0, Math.cos(this.state.heading));

    const forwardSpeed = this.state.velocity.dot(PhysicsEngine._forward);
    this.state.speedKmH = forwardSpeed * 3.6;

    let appliedAccel = 0;

    if (input.throttle > 0) {
      // Forward gas
      if (forwardSpeed < maxSpeedMs) {
        appliedAccel = input.throttle * accelRate;
      }
      this.rig.setBraking(false);
    } else if (input.throttle < 0 || input.brake) {
      // Braking or Reverse
      if (forwardSpeed > 0.8) {
        // Active footbrake
        appliedAccel = -brakeRate;
        this.rig.setBraking(true);
      } else {
        // Reverse gear
        if (forwardSpeed > -maxSpeedMs * 0.35) {
          appliedAccel = -accelRate * 0.55;
        }
        this.rig.setBraking(false);
      }
    } else {
      // Rolling natural engine drag
      appliedAccel = -forwardSpeed * 0.85;
      this.rig.setBraking(false);
    }

    // Handbrake
    this.state.isDrifting = input.handbrake && Math.abs(forwardSpeed) > 4;
    if (input.handbrake) {
      appliedAccel -= Math.sign(forwardSpeed) * brakeRate * 1.4;
      this.rig.setBraking(true);
    }

    // Integrate forward velocity
    const forwardVel = PhysicsEngine._forward.clone().multiplyScalar(forwardSpeed + appliedAccel * delta);

    // Lateral grip and drift
    const lateralDir = new THREE.Vector3(-PhysicsEngine._forward.z, 0, PhysicsEngine._forward.x);
    const lateralSpeed = this.state.velocity.dot(lateralDir);
    const gripFactor = this.state.isDrifting ? 0.88 : 0.96; // handbrake allows slide
    const lateralVel = lateralDir.multiplyScalar(lateralSpeed * gripFactor);

    this.state.velocity.copy(forwardVel).add(lateralVel);

    // Heading update from steering (only turns when moving)
    if (Math.abs(forwardSpeed) > 0.2) {
      const turnDirection = Math.sign(forwardSpeed);
      const turnRate = (this.state.steerAngle * config.turnSpeed * turnDirection) / Math.max(1.8, currentSpeed * 0.15);
      this.state.heading += turnRate * delta;
    }

    // 3. Position integration
    this.state.pos.addScaledVector(this.state.velocity, delta);

    // World boundary clamp
    this.state.pos.x = THREE.MathUtils.clamp(this.state.pos.x, -580, 580);
    this.state.pos.z = THREE.MathUtils.clamp(this.state.pos.z, -580, 580);

    // 4. Grounding & Suspension
    const groundY = getTerrainHeight(this.state.pos.x, this.state.pos.z);
    this.state.pos.y = THREE.MathUtils.damp(this.state.pos.y, groundY, 14, delta);

    // Suspension Pitch & Roll
    const targetPitch = THREE.MathUtils.clamp(-appliedAccel * 0.003, -0.08, 0.08);
    const targetRoll = THREE.MathUtils.clamp(-this.state.steerAngle * forwardSpeed * 0.015, -0.1, 0.1);
    this.state.pitch = THREE.MathUtils.damp(this.state.pitch, targetPitch, 8, delta);
    this.state.roll = THREE.MathUtils.damp(this.state.roll, targetRoll, 8, delta);

    // Update 3D mesh transforms
    this.rig.group.position.copy(this.state.pos);
    this.rig.group.rotation.set(this.state.pitch, this.state.heading, this.state.roll);

    // 5. Rotate wheels
    const wheelCircumference = Math.PI * 2 * config.wheelRadius;
    const wheelRotDelta = ((forwardSpeed * delta) / wheelCircumference) * Math.PI * 2;
    this.rig.allWheels.forEach((w) => {
      // Cylinder wheel rotated around local X
      w.children[0]?.rotateX(wheelRotDelta);
    });

    // Rotate trolley wheels if trolley is attached
    if (this.rig.trolleyWheels && this.rig.trolleyWheels.length > 0) {
      const trolleyWheelRot = ((forwardSpeed * delta) / (Math.PI * 2 * 0.52)) * Math.PI * 2;
      this.rig.trolleyWheels.forEach((tw) => {
        tw.children[0]?.rotateX(trolleyWheelRot);
      });
    }

    // Realistic Trailer Articulation Kinematics
    if (this.rig.trolleyGroup) {
      if (this.rig.trolleyType === 'cultivator') {
        // Cultivator is mounted directly onto the 3-point rear linkage
        this.rig.trolleyGroup.position.set(0, 0, -1.85);
        this.rig.trolleyGroup.rotation.y = 0;
      } else {
        // Wheeled Farm Trolleys: Pivot realistically around hitch pin
        const drawbarL = this.rig.trolleyDrawbarLength || 3.0;
        const hitchOffset = this.rig.trolleyHitchOffset || -2.4;

        if (this.rig.trolleyHeading === undefined) {
          this.rig.trolleyHeading = this.state.heading;
        }

        // Towed kinematic formula: d(theta_trailer)/dt = (v / L) * sin(headingDiff)
        const headingDiff = this.state.heading - this.rig.trolleyHeading;
        const normalizedDiff = Math.atan2(Math.sin(headingDiff), Math.cos(headingDiff));

        if (Math.abs(forwardSpeed) > 0.05) {
          const trailerTurnRate = (forwardSpeed / drawbarL) * Math.sin(normalizedDiff);
          this.rig.trolleyHeading += trailerTurnRate * delta;
        }

        // Relative yaw of trailer in tractor's local frame (prevent extreme unnatural jackknife > 75 deg)
        const relativeAngle = THREE.MathUtils.clamp(
          this.rig.trolleyHeading - this.state.heading,
          -Math.PI * 0.42,
          Math.PI * 0.42
        );

        this.rig.trolleyGroup.position.set(0, 0, hitchOffset);
        this.rig.trolleyGroup.rotation.y = relativeAngle;
      }
    }

    // 6. Collision Checking against obstacles
    const carRadius = config.width * 0.55;
    this.state.isColliding = false;

    for (let i = 0; i < this.collisionBoxes.length; i++) {
      const box = this.collisionBoxes[i];
      // Quick distance reject
      const dx = this.state.pos.x - box.center.x;
      const dz = this.state.pos.z - box.center.z;
      const distSq = dx * dx + dz * dz;
      const checkDist = carRadius + box.radius;

      if (distSq < checkDist * checkDist) {
        // Detailed AABB check
        const halfL = config.length / 2;
        const halfW = config.width / 2;
        const carMinX = this.state.pos.x - halfW;
        const carMaxX = this.state.pos.x + halfW;
        const carMinZ = this.state.pos.z - halfL;
        const carMaxZ = this.state.pos.z + halfL;

        if (carMaxX >= box.min.x && carMinX <= box.max.x && carMaxZ >= box.min.z && carMinZ <= box.max.z) {
          // Collision occurred!
          this.state.isColliding = true;
          const hitSpeed = this.state.velocity.length();

          // Push car back out of obstacle
          const pushDir = new THREE.Vector3(dx, 0, dz).normalize();
          if (pushDir.lengthSq() < 0.001) pushDir.set(0, 0, 1);

          this.state.pos.addScaledVector(pushDir, 0.4);
          this.state.velocity.multiplyScalar(-0.35); // Elastic bounce

          const now = Date.now();
          if (hitSpeed > 3 && now - this.state.lastCollisionTime > 400) {
            this.state.lastCollisionTime = now;
            soundManager.playCrash(Math.min(1, hitSpeed / 15));
            if (this.onCrashCallback) {
              this.onCrashCallback(hitSpeed * 3.6);
            }
          }
          break;
        }
      }
    }
  }
}
