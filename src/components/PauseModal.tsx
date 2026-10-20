/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Warehouse, Award, Settings, Home, X } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface PauseModalProps {
  onResume: () => void;
  onResetVehicle: () => void;
  onOpenGarage: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onResetVehicle,
  onOpenGarage,
  onOpenMissions,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col items-center">
        {/* HEADER */}
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-xs font-black tracking-widest text-amber-400 uppercase">Simulator Paused</span>
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-2xl font-black text-white mb-6">GAME PAUSED</h2>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3 w-full">
          {/* Resume */}
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME DRIVING</span>
          </button>

          {/* Unflip / Respawn */}
          <button
            onClick={() => {
              soundManager.playClick();
              onResetVehicle();
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm py-3 rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Reset Car Position</span>
          </button>

          {/* Garage */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenGarage();
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm py-3 rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Warehouse className="w-4 h-4 text-blue-400" />
            <span>Vehicle Garage</span>
          </button>

          {/* Missions */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenMissions();
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm py-3 rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Missions List</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings();
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm py-3 rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          {/* Exit to Main Menu */}
          <button
            onClick={() => {
              soundManager.playClick();
              onMainMenu();
            }}
            className="w-full mt-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs py-2.5 rounded-2xl border border-rose-800/40 flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>Exit to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
