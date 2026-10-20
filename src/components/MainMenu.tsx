/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Warehouse, Award, Settings, ChevronLeft, ChevronRight, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { VehicleConfig, VehicleType } from '../types/game';
import { VEHICLE_CONFIGS } from '../game/VehicleFactory';
import { soundManager } from '../audio/SoundManager';

interface MainMenuProps {
  money: number;
  selectedVehicleId: VehicleType;
  ownedVehicles: VehicleType[];
  hasGameInProgress: boolean;
  soundMuted: boolean;
  onSelectVehicle: (id: VehicleType) => void;
  onStartGame: () => void;
  onResumeGame: () => void;
  onOpenGarage: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  money,
  selectedVehicleId,
  ownedVehicles,
  hasGameInProgress,
  soundMuted,
  onSelectVehicle,
  onStartGame,
  onResumeGame,
  onOpenGarage,
  onOpenMissions,
  onOpenSettings,
  onToggleSound,
}) => {
  const vehicleList = Object.values(VEHICLE_CONFIGS);
  const currentIndex = vehicleList.findIndex((v) => v.id === selectedVehicleId);
  const currentVehicle: VehicleConfig = vehicleList[currentIndex] || vehicleList[0];
  const isUnlocked = ownedVehicles.includes(currentVehicle.id);

  const handlePrevVehicle = () => {
    soundManager.playClick();
    const newIdx = (currentIndex - 1 + vehicleList.length) % vehicleList.length;
    onSelectVehicle(vehicleList[newIdx].id);
  };

  const handleNextVehicle = () => {
    soundManager.playClick();
    const newIdx = (currentIndex + 1) % vehicleList.length;
    onSelectVehicle(vehicleList[newIdx].id);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 pointer-events-auto bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/70 select-none overflow-hidden font-sans">
      {/* TOP HEADER: Branding & Balance */}
      <div className="flex items-start justify-between w-full max-w-6xl mx-auto">
        {/* Bespoke Game Title Lockup */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest uppercase bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded shadow">
              3D Open World Simulator
            </span>
            <span className="text-xs font-semibold text-amber-300">v1.0 Bharat Edition</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mt-1 drop-shadow-md">
            INDIAN VILLAGE <span className="text-amber-400">LIFE</span>
          </h1>
          <p className="text-sm font-bold text-amber-200/90 tracking-wide mt-0.5">
            भारतीय ग्रामीण जीवन सिम्युलेटर • Open Highway & City Driving
          </p>
        </div>

        {/* Cash Balance & Sound Mute */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title="Toggle Sound"
          >
            {soundMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          <div className="bg-slate-900/90 border-2 border-amber-500/60 rounded-2xl px-5 py-2.5 shadow-xl flex items-center gap-3">
            <span className="text-2xl font-black text-amber-400">₹</span>
            <div>
              <div className="text-[10px] text-amber-300 uppercase tracking-widest font-bold">Total Savings</div>
              <div className="text-2xl font-black text-white tabular-nums tracking-wide">
                {money.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: Turntable Vehicle Switcher Selector */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="flex items-center gap-6">
          <button
            onClick={handlePrevVehicle}
            className="w-12 h-12 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-slate-700 flex items-center justify-center shadow-xl transition active:scale-90"
            title="Previous Vehicle"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-6 py-4 shadow-2xl flex flex-col items-center min-w-[280px] max-w-sm text-center">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {currentVehicle.category}
            </div>
            <h2 className="text-2xl font-black text-white mt-0.5">{currentVehicle.name}</h2>
            <p className="text-sm font-semibold text-amber-200/80">{currentVehicle.hindiName}</p>

            {/* Quick Specs */}
            <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-slate-800 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Top Speed</div>
                <div className="text-sm font-black text-white">{currentVehicle.maxSpeed} <span className="text-[9px]">km/h</span></div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Power</div>
                <div className="text-sm font-black text-white">{currentVehicle.acceleration * 10} <span className="text-[9px]">HP</span></div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Status</div>
                <div className={`text-xs font-black ${isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isUnlocked ? 'OWNED' : `₹${currentVehicle.price.toLocaleString('en-IN')}`}
                </div>
              </div>
            </div>

            {!isUnlocked && (
              <button
                onClick={onOpenGarage}
                className="mt-3 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2 rounded-xl transition"
              >
                Go to Garage to Unlock
              </button>
            )}
          </div>

          <button
            onClick={handleNextVehicle}
            className="w-12 h-12 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-slate-700 flex items-center justify-center shadow-xl transition active:scale-90"
            title="Next Vehicle"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Primary Start Game CTA */}
          <button
            onClick={onStartGame}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>PLAY NOW</span>
          </button>

          {/* Resume button if active game */}
          {hasGameInProgress && (
            <button
              onClick={onResumeGame}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base px-6 py-4 rounded-2xl shadow-xl flex items-center gap-2 transition hover:scale-105"
            >
              <span>RESUME GAME</span>
            </button>
          )}

          {/* Garage */}
          <button
            onClick={onOpenGarage}
            className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-base px-6 py-4 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-2.5 transition active:scale-95"
          >
            <Warehouse className="w-5 h-5 text-blue-400" />
            <span>GARAGE</span>
          </button>

          {/* Missions */}
          <button
            onClick={onOpenMissions}
            className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-base px-6 py-4 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-2.5 transition active:scale-95"
          >
            <Award className="w-5 h-5 text-amber-400" />
            <span>MISSIONS</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-base px-5 py-4 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-2 transition active:scale-95"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span>SETTINGS</span>
          </button>
        </div>

        {/* Flat control-hint line (As required by Game Craft Guidelines) */}
        <div className="text-xs font-semibold text-slate-400 tracking-wide text-center">
          WASD Move • Space Action & Drift • C Camera • H Horn • Esc Pause
        </div>
      </div>
    </div>
  );
};
