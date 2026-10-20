/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, Lock, Zap, Gauge, Shield, Palette, Disc, Volume2, Sparkles, Wrench } from 'lucide-react';
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
import { VEHICLE_CONFIGS } from '../game/VehicleFactory';
import { soundManager } from '../audio/SoundManager';

interface GarageModalProps {
  money: number;
  ownedVehicles: VehicleType[];
  selectedVehicleId: VehicleType;
  vehicleColors: Record<string, string>;
  vehicleUpgrades: Record<string, { engine: number; brakes: number; handling: number }>;
  tractorMods: Record<string, TractorModSettings>;
  onClose: () => void;
  onSelectVehicle: (id: VehicleType) => void;
  onBuyVehicle: (id: VehicleType, price: number) => void;
  onChangeColor: (vehicleId: VehicleType, color: string) => void;
  onUpgradeVehicle: (vehicleId: VehicleType, category: 'engine' | 'brakes' | 'handling', cost: number) => void;
  onUpdateTractorMods: (vehicleId: VehicleType, mods: TractorModSettings) => void;
}

const PAINT_COLORS = [
  { name: 'Swaraj Red', hex: '#dc2626' },
  { name: 'John Deere Green', hex: '#16a34a' },
  { name: 'New Holland Blue', hex: '#1d4ed8' },
  { name: 'Sarpanch Sky Blue', hex: '#0284c7' },
  { name: 'Sonalika Midnight Black', hex: '#0f172a' },
  { name: 'Saffron Orange', hex: '#f97316' },
  { name: 'Pearl White', hex: '#f8fafc' },
  { name: 'Mustard Ochre', hex: '#ca8a04' },
];

const RIM_COLORS: { id: RimColor; name: string; hex: string }[] = [
  { id: 'yellow', name: 'Agri Yellow', hex: '#facc15' },
  { id: 'white', name: 'Clean White', hex: '#ffffff' },
  { id: 'chrome', name: 'Mirror Chrome', hex: '#e2e8f0' },
  { id: 'red', name: 'Swaraj Red', hex: '#ef4444' },
  { id: 'black', name: 'Matte Black', hex: '#18181b' },
];

export const GarageModal: React.FC<GarageModalProps> = ({
  money,
  ownedVehicles,
  selectedVehicleId,
  vehicleColors,
  vehicleUpgrades,
  tractorMods,
  onClose,
  onSelectVehicle,
  onBuyVehicle,
  onChangeColor,
  onUpgradeVehicle,
  onUpdateTractorMods,
}) => {
  const [inspectVehicleId, setInspectVehicleId] = useState<VehicleType>(selectedVehicleId);
  const [activeTab, setActiveTab] = useState<'mods' | 'performance' | 'paint'>('mods');

  const vehicle = VEHICLE_CONFIGS[inspectVehicleId] || VEHICLE_CONFIGS.tractor;
  const isOwned = ownedVehicles.includes(inspectVehicleId);
  const isSelected = selectedVehicleId === inspectVehicleId;
  const currentColor = vehicleColors[inspectVehicleId] || vehicle.color;
  const upgrades = vehicleUpgrades[inspectVehicleId] || { engine: 0, brakes: 0, handling: 0 };
  const currentMods: TractorModSettings = tractorMods[inspectVehicleId] || { ...DEFAULT_TRACTOR_MODS };

  const upgradeCost = 1200;

  const handleSelect = () => {
    soundManager.playClick();
    onSelectVehicle(inspectVehicleId);
  };

  const handleBuy = () => {
    if (money >= vehicle.price) {
      soundManager.playReward();
      onBuyVehicle(inspectVehicleId, vehicle.price);
    } else {
      soundManager.playCrash(0.2);
    }
  };

  const handleUpgrade = (cat: 'engine' | 'brakes' | 'handling') => {
    if (money >= upgradeCost && upgrades[cat] < 3) {
      soundManager.playReward();
      onUpgradeVehicle(inspectVehicleId, cat, upgradeCost);
    } else {
      soundManager.playCrash(0.2);
    }
  };

  const updateMod = <K extends keyof TractorModSettings>(key: K, value: TractorModSettings[K]) => {
    soundManager.playClick();
    const updated = { ...currentMods, [key]: value };
    onUpdateTractorMods(inspectVehicleId, updated);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md font-sans select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg">
              🚜
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">INDIAN TRACTOR GARAGE & MOD SHOP</h2>
              <p className="text-xs text-slate-400 font-semibold">Customize trolleys, dozer bucket, Punjab DJ speakers, tyres & fleet</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-amber-500/40 rounded-xl px-3.5 py-1.5 flex items-center gap-2">
              <span className="text-amber-400 font-bold">₹</span>
              <span className="text-base sm:text-lg font-black text-white tabular-nums">
                {money.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* VEHICLE LIST (Left Column, 4 cols) */}
          <div className="lg:col-span-4 p-4 border-r border-slate-800 flex flex-col gap-2 overflow-y-auto max-h-[320px] lg:max-h-full">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2">
              Select Tractor & Vehicle
            </span>
            {Object.values(VEHICLE_CONFIGS).map((v) => {
              const owned = ownedVehicles.includes(v.id);
              const active = inspectVehicleId === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    soundManager.playClick();
                    setInspectVehicleId(v.id);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition text-left ${
                    active
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: vehicleColors[v.id] || v.color }}
                    />
                    <div>
                      <div className="text-xs sm:text-sm font-bold leading-tight">{v.name}</div>
                      <div className="text-[10px] text-slate-400">{v.hindiName}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {owned ? (
                      selectedVehicleId === v.id ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold">OWNED</span>
                      )
                    ) : (
                      <span className="text-xs font-black text-amber-400">
                        ₹{v.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* INSPECTION & CUSTOMIZATION (Right Column, 8 cols) */}
          <div className="lg:col-span-8 p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    {vehicle.category}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{vehicle.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-xl">{vehicle.description}</p>
                </div>

                <div className="text-right shrink-0">
                  {isOwned ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-xl text-xs font-bold">
                      <Check className="w-4 h-4" /> Unlocked
                    </span>
                  ) : (
                    <div className="bg-amber-950/40 border border-amber-500/40 px-3 py-1.5 rounded-xl text-right">
                      <div className="text-[9px] text-amber-300 font-bold uppercase">Price</div>
                      <div className="text-lg font-black text-amber-400">₹{vehicle.price.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* TAB SELECTOR */}
              <div className="flex items-center gap-2 mt-5 border-b border-slate-800 pb-2">
                <button
                  onClick={() => { soundManager.playClick(); setActiveTab('mods'); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    activeTab === 'mods'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Tractor Modifications & Trolley</span>
                </button>

                <button
                  onClick={() => { soundManager.playClick(); setActiveTab('paint'); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    activeTab === 'paint'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Paint & Rims</span>
                </button>

                <button
                  onClick={() => { soundManager.playClick(); setActiveTab('performance'); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    activeTab === 'performance'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Engine Tuning</span>
                </button>
              </div>

              {/* TAB CONTENT: 1. TRACTOR MODIFICATIONS */}
              {activeTab === 'mods' && (
                <div className="mt-4 space-y-4">
                  {/* 1. TROLLEY / IMPLEMENT ATTACHMENT */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                        <span>🌾 Rear Agricultural Attachment (Trolley / Implement)</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'grain_trolley' as TrolleyType, name: 'Grain Trolley', desc: 'Loaded with 50kg Wheat Sacks', icon: '🌾' },
                        { id: 'sugarcane_trolley' as TrolleyType, name: 'Sugarcane Trolley', desc: 'Tall Steel Mesh Cane Trailer', icon: '🎋' },
                        { id: 'tanker' as TrolleyType, name: 'Dairy Tanker', desc: 'Purple/Silver Milk & Water Tanker', icon: '🥛' },
                        { id: 'cultivator' as TrolleyType, name: 'DELEKS Cultivator', desc: '9-Tine Spring Soil Tiller (Hal)', icon: '🚜' },
                        { id: 'none' as TrolleyType, name: 'No Trolley', desc: 'Bare tractor rear hitch', icon: '🚫' },
                      ].map((t) => {
                        const isCurrent = currentMods.trolleyType === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => updateMod('trolleyType', t.id)}
                            className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                              isCurrent
                                ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400'
                                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-base">
                              <span>{t.icon}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <div className="mt-1">
                              <div className="text-xs font-bold leading-tight">{t.name}</div>
                              <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{t.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. FRONT BUMPER / ATTACHMENT */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide block mb-2">
                      🚜 Front Bumper & Loader Attachment
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'dozer_bucket' as FrontAttachment, name: 'Front Dozer Bucket', desc: 'Heavy Hydraulic Loader Shovel', icon: '🚜' },
                        { id: 'heavy_bumper' as FrontAttachment, name: '500 KG Ballast Block', desc: 'Cast-iron stamped weight stack', icon: '🧱' },
                        { id: 'chrome_bullbar' as FrontAttachment, name: 'Tubular Bull-bar', desc: 'Highway chrome protection bar', icon: '🛡️' },
                        { id: 'none' as FrontAttachment, name: 'Clean Front', desc: 'Standard towing clevis pin', icon: '➖' },
                      ].map((b) => {
                        const isCurrent = currentMods.frontAttachment === b.id;
                        return (
                          <button
                            key={b.id}
                            onClick={() => updateMod('frontAttachment', b.id)}
                            className={`p-2 rounded-xl border text-left transition ${
                              isCurrent
                                ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-400'
                                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-base">
                              <span>{b.icon}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                            </div>
                            <div className="text-xs font-bold leading-tight mt-1">{b.name}</div>
                            <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{b.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. CABIN & SOUND SYSTEM */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wide block mb-2">
                      🔊 Cabin Style & Punjabi DJ Sound System
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'open_canopy_dj' as CabinStyle, name: 'Punjabi DJ Sound Box', desc: '8 Subwoofers + Flashing LED rings', icon: '🔊' },
                        { id: 'enclosed_glass' as CabinStyle, name: 'Deluxe Glass Cabin', desc: 'Panoramic ROPS cabin with LED lights', icon: '🏢' },
                        { id: 'open_rollbar' as CabinStyle, name: 'Classic Roll-Bar', desc: 'Tubular ROPS safety bar', icon: '🔩' },
                        { id: 'sunshade_flat' as CabinStyle, name: 'Flat Sunshade Canopy', desc: 'Village traditional canvas shade', icon: '⛱️' },
                      ].map((c) => {
                        const isCurrent = currentMods.cabinStyle === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => updateMod('cabinStyle', c.id)}
                            className={`p-2 rounded-xl border text-left transition ${
                              isCurrent
                                ? 'bg-rose-500/20 border-rose-400 text-white ring-1 ring-rose-400'
                                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-base">
                              <span>{c.icon}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-rose-400" />}
                            </div>
                            <div className="text-xs font-bold leading-tight mt-1">{c.name}</div>
                            <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{c.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. TYRE STYLE & DEEP CHEVRON TREADS */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block mb-2">
                      🛞 Tractor Tyres & Deep-Lug Chevron Tread
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'monster_wide' as TyreStyle, name: 'Monster Wide Tyres', desc: 'Super-wide Apollo/MRF deep lugs', icon: '🚜' },
                        { id: 'dual_rear' as TyreStyle, name: 'Dual Rear Tyres', desc: 'Twin dual wheels for heavy pulling', icon: '⚙️' },
                        { id: 'deep_lug' as TyreStyle, name: 'Standard Field Tyres', desc: 'Deep herringbone chevron tread', icon: '🌾' },
                      ].map((ts) => {
                        const isCurrent = currentMods.tyreStyle === ts.id;
                        return (
                          <button
                            key={ts.id}
                            onClick={() => updateMod('tyreStyle', ts.id)}
                            className={`p-2 rounded-xl border text-left transition ${
                              isCurrent
                                ? 'bg-emerald-500/20 border-emerald-400 text-white ring-1 ring-emerald-400'
                                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-base">
                              <span>{ts.icon}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                            <div className="text-xs font-bold leading-tight mt-1">{ts.name}</div>
                            <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{ts.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. SILENCER EXHAUST STACK */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide block mb-2">
                      💨 Exhaust Stack & Punjab Flapper
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'punjab_flapper' as SilencerStyle, name: 'Punjab Flapper Stack', desc: 'Rain flapper cap with black diesel smoke puffs', icon: '💨' },
                        { id: 'straight_chrome' as SilencerStyle, name: 'Straight Chrome Pipe', desc: 'High gleaming vertical chrome chimney', icon: '🎺' },
                        { id: 'curved' as SilencerStyle, name: 'Curved Side Pipe', desc: 'Curved side tractor exhaust', icon: '↪️' },
                      ].map((ss) => {
                        const isCurrent = currentMods.silencerStyle === ss.id;
                        return (
                          <button
                            key={ss.id}
                            onClick={() => updateMod('silencerStyle', ss.id)}
                            className={`p-2 rounded-xl border text-left transition ${
                              isCurrent
                                ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400'
                                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-base">
                              <span>{ss.icon}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <div className="text-xs font-bold leading-tight mt-1">{ss.name}</div>
                            <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{ss.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: 2. PAINT & RIMS */}
              {activeTab === 'paint' && (
                <div className="mt-4 space-y-5">
                  {/* BODY PAINT FINISH */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Tractor & Vehicle Body Paint</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {PAINT_COLORS.map((col) => {
                        const isColSelected = currentColor.toLowerCase() === col.hex.toLowerCase();
                        return (
                          <button
                            key={col.name}
                            onClick={() => {
                              soundManager.playClick();
                              onChangeColor(inspectVehicleId, col.hex);
                            }}
                            className={`w-10 h-10 rounded-xl transition border-2 flex items-center justify-center ${
                              isColSelected ? 'border-amber-400 scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: col.hex }}
                            title={col.name}
                          >
                            {isColSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* DEEP DISH RIM FINISH */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Disc className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Pressed Steel Rim Color</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {RIM_COLORS.map((rim) => {
                        const isRimSelected = currentMods.rimColor === rim.id;
                        return (
                          <button
                            key={rim.id}
                            onClick={() => updateMod('rimColor', rim.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition ${
                              isRimSelected
                                ? 'bg-amber-500/20 border-amber-400 text-white'
                                : 'bg-slate-800/60 border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: rim.hex }} />
                            <span className="text-xs font-bold">{rim.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: 3. PERFORMANCE TUNING */}
              {activeTab === 'performance' && (
                <div className="mt-4 space-y-4">
                  {/* SPECIFICATION METRICS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                        <Gauge className="w-4 h-4 text-cyan-400" />
                        <span>Top Speed</span>
                      </div>
                      <span className="text-xl font-black text-white">{vehicle.maxSpeed} km/h</span>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${(vehicle.maxSpeed / 190) * 100}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Torque & Power</span>
                      </div>
                      <span className="text-xl font-black text-white">{vehicle.acceleration * 10} HP</span>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(vehicle.acceleration / 70) * 100}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                        <Shield className="w-4 h-4 text-rose-400" />
                        <span>Braking</span>
                      </div>
                      <span className="text-xl font-black text-white">{vehicle.brakeForce}</span>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-rose-400 h-full rounded-full" style={{ width: `${(vehicle.brakeForce / 70) * 100}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                        <Gauge className="w-4 h-4 text-emerald-400" />
                        <span>Turning Radius</span>
                      </div>
                      <span className="text-xl font-black text-white">{vehicle.turnSpeed}</span>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(vehicle.turnSpeed / 3.5) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* TUNING UPGRADES */}
                  {isOwned && (
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Heavy Tuning Upgrades (₹{upgradeCost.toLocaleString('en-IN')} each)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2.5">
                        {(['engine', 'brakes', 'handling'] as const).map((cat) => {
                          const level = upgrades[cat];
                          const isMax = level >= 3;
                          return (
                            <div key={cat} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold text-white capitalize">{cat} Tuning</div>
                                <div className="text-[10px] text-slate-400">Level {level} / 3</div>
                              </div>
                              <button
                                disabled={isMax || money < upgradeCost}
                                onClick={() => handleUpgrade(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  isMax
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : money >= upgradeCost
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {isMax ? 'MAX' : `Upgrade`}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-4">
              {isOwned ? (
                <button
                  onClick={handleSelect}
                  disabled={isSelected}
                  className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition ${
                    isSelected
                      ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow-xl'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-5 h-5" /> Currently Selected
                    </>
                  ) : (
                    'Drive This Vehicle'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={money < vehicle.price}
                  className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition ${
                    money >= vehicle.price
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow-xl'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  {money >= vehicle.price
                    ? `Buy for ₹${vehicle.price.toLocaleString('en-IN')}`
                    : `Need ₹${(vehicle.price - money).toLocaleString('en-IN')} More`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
