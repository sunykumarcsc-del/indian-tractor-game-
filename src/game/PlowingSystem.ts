/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager';

export interface PlowingFieldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
}

export interface PlowingStatus {
  isInsideField: boolean;
  isPlowing: boolean;
  plowedPercent: number;
  totalPlowedAreaM2: number;
  fieldCompleted: boolean;
  justCompleted: boolean;
}

export class PlowingSystem {
  public root: THREE.Group;
  public fieldMesh: THREE.Mesh;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;

  // Grid for tracking plowed cells (e.g. 40 cols x 35 rows)
  private readonly gridCols = 44;
  private readonly gridRows = 36;
  private plowedGrid: boolean[][];
  private totalCells: number;
  private plowedCellsCount: number = 0;

  // Field geometry & world bounds
  public readonly bounds: PlowingFieldBounds = {
    centerX: -210,
    centerZ: -100,
    width: 88,
    depth: 72,
    minX: -210 - 44, // -254
    maxX: -210 + 44, // -166
    minZ: -100 - 36, // -136
    maxZ: -100 + 36, // -64
  };

  private fieldCompleted: boolean = false;
  private completionRewardGiven: boolean = false;
  private onCompleteCallback?: (reward: number, msg: string) => void;

  constructor(sceneRoot: THREE.Object3D) {
    this.root = new THREE.Group();
    this.root.name = 'PlowingSystem_Root';
    sceneRoot.add(this.root);

    this.totalCells = this.gridCols * this.gridRows;
    this.plowedGrid = Array.from({ length: this.gridRows }, () =>
      Array(this.gridCols).fill(false)
    );

    // Initialize 512x512 Canvas for real-time dynamic soil texture
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 512;
    this.ctx = this.canvas.getContext('2d')!;

    // Initial Unplowed Field Texture (Golden mustard blossoms with green vegetation)
    this.paintInitialField();

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;

    // Field plane slightly elevated above ground terrain (y = 0.09)
    const fieldGeo = new THREE.PlaneGeometry(this.bounds.width, this.bounds.depth);
    fieldGeo.rotateX(-Math.PI / 2);

    const fieldMat = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.95,
      metalness: 0.05,
    });

    this.fieldMesh = new THREE.Mesh(fieldGeo, fieldMat);
    this.fieldMesh.position.set(this.bounds.centerX, 0.09, this.bounds.centerZ);
    this.fieldMesh.receiveShadow = true;
    this.root.add(this.fieldMesh);

    // Add wooden farm fencing & decorative surveyor boundary flags around field
    this.buildFieldBoundaries();
  }

  public setOnComplete(cb: (reward: number, msg: string) => void) {
    this.onCompleteCallback = cb;
  }

  // Paint lush golden-green unplowed cropland
  private paintInitialField() {
    const { ctx } = this;
    // Base rich fertile soil with unplowed stubble / mustard flowers
    ctx.fillStyle = '#7a8c3d'; // Golden green unplowed farmland
    ctx.fillRect(0, 0, 512, 512);

    // Organic grass & mustard flower flecks
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random();
      if (r < 0.4) {
        ctx.fillStyle = '#eab308'; // Mustard yellow blossom
        ctx.fillRect(x, y, 3, 3);
      } else if (r < 0.7) {
        ctx.fillStyle = '#65a30d'; // Green leaf
        ctx.fillRect(x, y, 2, 4);
      } else {
        ctx.fillStyle = '#5c6f2a'; // Stubble stalk
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Subtle pre-plow tractor access boundary path
    ctx.strokeStyle = 'rgba(74, 44, 17, 0.35)';
    ctx.lineWidth = 14;
    ctx.strokeRect(8, 8, 496, 496);
  }

  // Fence and farm signage
  private buildFieldBoundaries() {
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.4, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const flagMat = new THREE.MeshStandardMaterial({ color: '#ea580c', side: THREE.DoubleSide });

    const minX = -this.bounds.width / 2;
    const maxX = this.bounds.width / 2;
    const minZ = -this.bounds.depth / 2;
    const maxZ = this.bounds.depth / 2;

    const fenceGroup = new THREE.Group();
    fenceGroup.position.set(this.bounds.centerX, 0, this.bounds.centerZ);

    // Corner and perimeter wooden posts with orange field flags
    const postStep = 11;
    for (let x = minX; x <= maxX; x += postStep) {
      this.createFencePost(fenceGroup, x, minZ, postGeo, postMat, flagMat);
      this.createFencePost(fenceGroup, x, maxZ, postGeo, postMat, flagMat);
    }
    for (let z = minZ + postStep; z < maxZ; z += postStep) {
      this.createFencePost(fenceGroup, minX, z, postGeo, postMat, flagMat);
      this.createFencePost(fenceGroup, maxX, z, postGeo, postMat, flagMat);
    }

    // Wooden Field Entrance Sign ("RAMPUR KRISHI FARM")
    const signGroup = new THREE.Group();
    signGroup.position.set(minX + 12, 0, maxZ + 2);

    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.2, 8), postMat);
    postL.position.set(-2.5, 1.6, 0);
    const postR = postL.clone();
    postR.position.set(2.5, 1.6, 0);
    signGroup.add(postL, postR);

    // Canvas board for Hindi/English Farm Sign
    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = 512;
    boardCanvas.height = 128;
    const bctx = boardCanvas.getContext('2d')!;
    bctx.fillStyle = '#b45309';
    bctx.fillRect(0, 0, 512, 128);
    bctx.strokeStyle = '#fef08a';
    bctx.lineWidth = 6;
    bctx.strokeRect(8, 8, 496, 112);

    bctx.fillStyle = '#ffffff';
    bctx.font = 'bold 36px sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText('🌾 रामपुर कृषि फार्म • खेत जुताई', 256, 52);

    bctx.fillStyle = '#fef08a';
    bctx.font = 'bold 22px sans-serif';
    bctx.fillText('DELEKS CULTIVATOR PLOWING FIELD', 256, 95);

    const boardTex = new THREE.CanvasTexture(boardCanvas);
    boardTex.colorSpace = THREE.SRGBColorSpace;
    const boardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 1.3, 0.15),
      new THREE.MeshStandardMaterial({ map: boardTex })
    );
    boardMesh.position.set(0, 2.5, 0);
    signGroup.add(boardMesh);

    fenceGroup.add(signGroup);
    this.root.add(fenceGroup);
  }

  private createFencePost(
    parent: THREE.Group,
    x: number,
    z: number,
    postGeo: THREE.CylinderGeometry,
    postMat: THREE.Material,
    flagMat: THREE.Material
  ) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, 0.7, z);
    parent.add(post);

    // Small triangular boundary flag on top
    const flagGeo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      0, 1.4, 0,
      0.6, 1.2, 0,
      0, 1.0, 0,
    ]);
    flagGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    flagGeo.computeVertexNormals();
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(x, 0, z);
    parent.add(flag);
  }

  /**
   * Reset field back to unplowed state
   */
  public resetField() {
    this.paintInitialField();
    this.texture.needsUpdate = true;
    this.plowedCellsCount = 0;
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        this.plowedGrid[r][c] = false;
      }
    }
    this.fieldCompleted = false;
    this.completionRewardGiven = false;
  }

  /**
   * Main gameplay update: called from GameEngine update loop
   */
  public update(
    tractorPos: THREE.Vector3,
    trolleyType: import('../types/game').TrolleyType | undefined,
    speedKmH: number,
    heading: number,
    delta: number
  ): PlowingStatus {
    const isInsideField =
      tractorPos.x >= this.bounds.minX &&
      tractorPos.x <= this.bounds.maxX &&
      tractorPos.z >= this.bounds.minZ &&
      tractorPos.z <= this.bounds.maxZ;

    const hasCultivator = trolleyType === 'cultivator';
    const isMoving = Math.abs(speedKmH) > 1.2;
    const isPlowing = isInsideField && hasCultivator && isMoving;

    let justCompleted = false;

    if (isPlowing) {
      // Cultivator tines are situated behind the tractor (approx 2.4m behind tractor origin)
      const tinesX = tractorPos.x - Math.sin(heading) * 2.4;
      const tinesZ = tractorPos.z - Math.cos(heading) * 2.4;

      // Check if tines are within field bounds
      if (
        tinesX >= this.bounds.minX &&
        tinesX <= this.bounds.maxX &&
        tinesZ >= this.bounds.minZ &&
        tinesZ <= this.bounds.maxZ
      ) {
        // Map world coordinate to field uv [0..1]
        const u = (tinesX - this.bounds.minX) / this.bounds.width;
        // PlaneGeometry has Y from -Z in three.js: mapping z to v
        const v = (tinesZ - this.bounds.minZ) / this.bounds.depth;

        // Map to canvas pixel space [0..512]
        const px = Math.floor(u * 512);
        const py = Math.floor(v * 512);

        // Map to cell grid [0..gridCols, 0..gridRows]
        const col = Math.floor(u * this.gridCols);
        const row = Math.floor(v * this.gridRows);

        // Mark grid cells within a 2.8m cultivator width swath
        const cellRadius = 1;
        for (let dr = -cellRadius; dr <= cellRadius; dr++) {
          for (let dc = -cellRadius; dc <= cellRadius; dc++) {
            const cr = row + dr;
            const cc = col + dc;
            if (cr >= 0 && cr < this.gridRows && cc >= 0 && cc < this.gridCols) {
              if (!this.plowedGrid[cr][cc]) {
                this.plowedGrid[cr][cc] = true;
                this.plowedCellsCount++;
              }
            }
          }
        }

        // Draw plowed furrow swath onto the dynamic canvas texture!
        const furrowWidthPx = 28; // width of cultivator tines in texture space
        const furrowLengthPx = 18;

        this.ctx.save();
        this.ctx.translate(px, py);
        // Rotate furrows parallel/perpendicular to driving direction
        this.ctx.rotate(heading);

        // 1. Dark damp freshly tilled soil base
        this.ctx.fillStyle = '#2d1810';
        this.ctx.fillRect(-furrowWidthPx / 2, -furrowLengthPx / 2, furrowWidthPx, furrowLengthPx);

        // 2. Deep furrow ridges (lines cut into the earth by 9 steel cultivator tines)
        const tinesCount = 7;
        const spacing = furrowWidthPx / tinesCount;
        for (let t = 0; t < tinesCount; t++) {
          const tx = -furrowWidthPx / 2 + t * spacing + spacing / 2;

          // Deep dark furrow bottom
          this.ctx.fillStyle = '#1a0d07';
          this.ctx.fillRect(tx - 2, -furrowLengthPx / 2, 4, furrowLengthPx);

          // Clod ridges highlighted by sunlight
          this.ctx.fillStyle = '#4a2c11';
          this.ctx.fillRect(tx - 4, -furrowLengthPx / 2, 2, furrowLengthPx);
          this.ctx.fillStyle = '#653a1a';
          this.ctx.fillRect(tx + 2, -furrowLengthPx / 2, 2, furrowLengthPx);
        }

        // 3. Natural soil clods & texture variation
        for (let i = 0; i < 8; i++) {
          const cx = (Math.random() - 0.5) * furrowWidthPx;
          const cy = (Math.random() - 0.5) * furrowLengthPx;
          this.ctx.fillStyle = Math.random() > 0.5 ? '#150a05' : '#5a3316';
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, 1.5 + Math.random() * 2, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
        this.texture.needsUpdate = true;
      }
    }

    const plowedPercent = Math.min(100, Math.round((this.plowedCellsCount / this.totalCells) * 100));
    const totalPlowedAreaM2 = Math.round((this.bounds.width * this.bounds.depth * plowedPercent) / 100);

    // Completion condition: >= 80% plowed
    if (plowedPercent >= 80 && !this.fieldCompleted) {
      this.fieldCompleted = true;
      justCompleted = true;
      if (!this.completionRewardGiven) {
        this.completionRewardGiven = true;
        soundManager.playReward();
        if (this.onCompleteCallback) {
          this.onCompleteCallback(
            6500,
            `🌾 खेत की जुताई पूरी हुई! (Field ${plowedPercent}% Plowed! +₹6,500)`
          );
        }
      }
    }

    return {
      isInsideField,
      isPlowing,
      plowedPercent,
      totalPlowedAreaM2,
      fieldCompleted: this.fieldCompleted,
      justCompleted,
    };
  }

  public getPlowedPercent(): number {
    return Math.min(100, Math.round((this.plowedCellsCount / this.totalCells) * 100));
  }
}
