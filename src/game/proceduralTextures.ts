/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

function setupTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Asphalt road with dual yellow center dashes and solid white borders
export function createHighwayRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark road base
  ctx.fillStyle = '#26292e';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt grain
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = Math.floor(Math.random() * 30 + 30);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Outer white edge lines
  ctx.fillStyle = '#f0f3f6';
  ctx.fillRect(20, 0, 10, 512);
  ctx.fillRect(482, 0, 10, 512);

  // Dashed yellow center lines (Indian NH style)
  ctx.fillStyle = '#f5b016';
  ctx.fillRect(250, 40, 12, 160);
  ctx.fillRect(250, 300, 12, 160);

  // Lane dividers (white dashed)
  ctx.fillStyle = '#d8dee9';
  ctx.fillRect(135, 60, 6, 120);
  ctx.fillRect(135, 320, 6, 120);
  ctx.fillRect(370, 60, 6, 120);
  ctx.fillRect(370, 320, 6, 120);

  return setupTexture(canvas);
}

// Village dirt / clay road with tractor ruts and dust variations
export function createVillagePathTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Indian dusty mud base
  ctx.fillStyle = '#a67c52';
  ctx.fillRect(0, 0, 512, 512);

  // Dirt patches
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 140 + Math.random() * 40;
    const g = 100 + Math.random() * 35;
    const b = 60 + Math.random() * 30;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, 3, 3);
  }

  // Subtle tyre ruts along center
  ctx.fillStyle = 'rgba(110, 75, 45, 0.45)';
  ctx.fillRect(110, 0, 50, 512);
  ctx.fillRect(352, 0, 50, 512);

  return setupTexture(canvas);
}

// Indian red brick wall
export function createBrickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Mortar background
  ctx.fillStyle = '#c7b299';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const cols = 4;
  const rowH = 256 / rows;
  const colW = 256 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW / 2);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset + 2;
      const y = r * rowH + 2;
      const w = colW - 4;
      const h = rowH - 4;

      const tone = Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${165 + tone}, ${58 + tone}, ${42 + tone})`;
      ctx.fillRect(x, y, w, h);
    }
  }

  return setupTexture(canvas);
}

// Highway Toll Signboard
export function createTollSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // National highway green background
  ctx.fillStyle = '#0f5132';
  ctx.fillRect(0, 0, 512, 256);

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NH-44 TOLL PLAZA', 256, 65);

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#facc15';
  ctx.fillText('STOP & PAY TOLL: ₹50', 256, 115);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('FASTag / CASH LANE', 256, 160);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('NATIONAL HIGHWAYS AUTHORITY OF INDIA', 256, 210);

  return setupTexture(canvas);
}

// Rampur Village Arch Sign
export function createVillageArchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('रामपुर ग्राम आपका स्वागत करता है', 256, 52);

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('WELCOME TO RAMPUR VILLAGE', 256, 95);

  return setupTexture(canvas);
}

// Highway Dhaba Sign
export function createDhabaSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 144);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SHER-E-PUNJAB DHABA', 256, 60);

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('☕ DESI CHAI • TANDOORI ROTI • DAL MAKHANI', 256, 105);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('24 HOURS HIGHWAY REST STOP', 256, 138);

  return setupTexture(canvas);
}

// Petrol Station Canopy Sign
export function createPetrolSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ea580c';
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 80, 512, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INDIAN PETROLEUM', 256, 55);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#facc15';
  ctx.fillText('PETROL  |  DIESEL  |  CNG  |  AIR & REPAIR', 256, 112);

  return setupTexture(canvas);
}

// Airport Terminal Sign
export function createAirportSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 148);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✈ BHARATPUR AIRPORT', 256, 60);

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#93c5fd';
  ctx.fillText('TERMINAL 1 & AIR CARGO LOGISTICS', 256, 105);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('RESTRICTED RUNWAY ZONE', 256, 140);

  return setupTexture(canvas);
}

// Iconic Indian Truck Tailgate Art: "HORN OK PLEASE"
export function createTruckTailgateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Bright yellow background
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 512, 256);

  // Red & Green borders
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 472, 216);

  // Horn OK Please
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HORN  OK  PLEASE', 256, 95);

  // Humorous traditional slogan
  ctx.fillStyle = '#15803d';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('DEKHO MAGAR PYAAR SE', 256, 155);

  // Safety notice
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('★ USE DIPPER AT NIGHT ★ SPEED 40 KM/H ★', 256, 205);

  return setupTexture(canvas);
}

// Farmland Crop / Mustard Field
export function createMustardCropTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4d7c0f'; // Dark foliage
  ctx.fillRect(0, 0, 256, 256);

  // Bright golden yellow mustard flower flecks
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.4 ? '#facc15' : '#eab308';
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  return setupTexture(canvas);
}

// Airport runway texture with center stripes
export function createRunwayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, 256, 512);

  // Side lines
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(10, 0, 6, 512);
  ctx.fillRect(240, 0, 6, 512);

  // Center dash
  ctx.fillRect(122, 50, 12, 140);
  ctx.fillRect(122, 310, 12, 140);

  return setupTexture(canvas);
}

// Modern Tractor Front Radiator Grille Texture
export function createTractorGrilleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 256, 256);

  // Honeycomb perforated mesh
  ctx.fillStyle = '#1f2937';
  for (let y = 8; y < 248; y += 12) {
    const shift = (Math.floor(y / 12) % 2) * 6;
    for (let x = 8 + shift; x < 248; x += 12) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Chrome horizontal accent strips
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(20, 80, 216, 4);
  ctx.fillRect(20, 140, 216, 4);
  ctx.fillRect(20, 200, 216, 4);

  // Red/Chrome brand badge in center
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(98, 95, 60, 30);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.strokeRect(98, 95, 60, 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NOVO', 128, 115);

  return setupTexture(canvas);
}

// Tractor Dashboard Telematics Screen Texture
export function createTractorDashboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('RPM: 2200', 16, 36);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('GEAR: 4H', 16, 68);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('4WD ACTIVE', 16, 100);

  // Digital fuel and temperature gauges
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(160, 20, 80, 16);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(160, 50, 60, 16);

  return setupTexture(canvas);
}

// Front Cast-Iron Ballast Weight Block Texture
export function createWeightBlockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 128);

  // Segment lines between modular weight plates
  ctx.fillStyle = '#0f172a';
  for (let x = 32; x < 256; x += 32) {
    ctx.fillRect(x - 2, 0, 4, 128);
  }

  // Cast iron texture speckles
  for (let i = 0; i < 1500; i++) {
    const px = Math.random() * 256;
    const py = Math.random() * 128;
    const s = 25 + Math.random() * 30;
    ctx.fillStyle = `rgb(${s},${s},${s})`;
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  // Stamped Weight Label
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('500 KG BALLAST', 128, 70);

  return setupTexture(canvas);
}

// Burlap Grain Sacks texture for Farm Trolley load
export function createTrolleySacksTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b49774'; // Burlap jute base
  ctx.fillRect(0, 0, 512, 512);

  // Woven sack rows
  for (let y = 0; y < 512; y += 64) {
    ctx.strokeStyle = '#856644';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    for (let x = 0; x < 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x + (y % 128 === 0 ? 0 : 64), y);
      ctx.lineTo(x + (y % 128 === 0 ? 0 : 64), y + 64);
      ctx.stroke();

      // Stenciled Wheat / Grain stamp
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('SHARBATI', x + 15, y + 36);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('WHEAT 50KG', x + 15, y + 52);
    }
  }

  // Jute fibers
  for (let i = 0; i < 3000; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#d6c2a8' : '#715438';
    ctx.fillRect(px, py, 2, 2);
  }

  return setupTexture(canvas);
}

// Punjabi DJ Modified Tractor Speaker Box Texture
export function createDJSpeakerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Black textured amplifier cabinet
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 256);

  // Chrome framing border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 244);

  // 6 Circular Subwoofers with orange LED glowing rims (like image 1 & 5!)
  const speakerCols = [55, 135, 215, 295, 375, 455];
  for (let row = 0; row < 2; row++) {
    const cy = 70 + row * 115;
    for (let cx of speakerCols) {
      // Outer neon glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();

      // Black speaker cone
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.fillStyle = '#18181b';
      ctx.fill();

      // Inner silver dustcap
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#e4e4e7';
      ctx.fill();
    }
  }

  // Top DJ Branding Slogan
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ PUNJABI BASS SOUND SYSTEM ★', 256, 26);

  return setupTexture(canvas);
}

// Milk / Water Tanker Body Texture (Like image 1)
export function createTankerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Vibrant Purple / Magenta base from image 1
  ctx.fillStyle = '#7e22ce';
  ctx.fillRect(0, 0, 512, 256);

  // Bright yellow border
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);

  // Black bold banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(40, 75, 432, 105);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TANKER', 256, 150);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('PURE DAIRY MILK & WATER SUPPLY', 256, 215);

  return setupTexture(canvas);
}

// Sugarcane stalk bundles texture for sugarcane trolley
export function createSugarcaneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#65a30d'; // Cane green base
  ctx.fillRect(0, 0, 256, 256);

  // Vertical cane stalks
  for (let x = 0; x < 256; x += 12) {
    ctx.fillStyle = (x % 24 === 0) ? '#4d7c0f' : '#84cc16';
    ctx.fillRect(x, 0, 10, 256);

    // Stalk nodes / rings
    ctx.fillStyle = '#fef08a';
    for (let y = 16; y < 256; y += 48) {
      ctx.fillRect(x, y + ((x * 7) % 15), 10, 3);
    }
  }

  return setupTexture(canvas);
}

// Front Dozer / Loader Bucket Hydraulic Decal
export function createDozerBucketTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Blue metal plate like image 1!
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 0, 256, 128);

  // Warning hazard stripes on bottom edge
  const stripeW = 20;
  for (let i = 0; i < 256; i += stripeW * 2) {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(i, 108);
    ctx.lineTo(i + stripeW, 108);
    ctx.lineTo(i + stripeW + 12, 128);
    ctx.lineTo(i + 12, 128);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(i + stripeW, 108);
    ctx.lineTo(i + stripeW * 2, 108);
    ctx.lineTo(i + stripeW * 2 + 12, 128);
    ctx.lineTo(i + stripeW + 12, 128);
    ctx.fill();
  }

  // Heavy Duty Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HEAVY LOADER', 128, 55);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('KUBOTA / SARPANCH HYDRAULIC', 128, 85);

  return setupTexture(canvas);
}

// Cultivator ("Hal") Brand Decal like image 3 (DELEKS)
export function createCultivatorBrandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dc2626'; // Red implement beam
  ctx.fillRect(0, 0, 256, 64);

  // White label box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(20, 10, 216, 44);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'black 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DELEKS TILLER', 128, 42);

  return setupTexture(canvas);
}

// Grand Metro City Welcome Arch Texture
export function createCityWelcomeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Deep indigo/navy highway gantry sign
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);

  // Border
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WELCOME TO METRO CITY', 256, 44);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('स्मार्ट सिटी मेट्रो में आपका स्वागत है', 256, 82);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('SPEED LIMIT 60 KM/H • FASTag ENABLED', 256, 110);

  return setupTexture(canvas);
}

// Highway Direction Gantry Board (Green Indian National Highway signage)
export function createHighwayDirectionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // Indian NH Green background
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 148);

  // Header
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NH-44 NATIONAL HIGHWAY • राष्ट्रीय राजमार्ग', 256, 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('⬱ AIRPORT  2.5 KM', 24, 75);
  ctx.fillText('↑ METRO CITY  1.0 KM', 24, 110);
  ctx.fillText('⤳ RAMPUR VILLAGE  3.0 KM', 24, 145);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('TOLL 500M 🛑', 485, 110);

  return setupTexture(canvas);
}


