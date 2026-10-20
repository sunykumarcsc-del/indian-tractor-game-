/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sun, Sunset, Moon, Volume2, VolumeX, Smartphone, RotateCcw } from 'lucide-react';
import { TimeOfDay } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface SettingsModalProps {
  timeOfDay: TimeOfDay;
  soundEnabled: boolean;
  soundVolume: number;
  touchControls: boolean;
  onClose: () => void;
  onSetTimeOfDay: (tod: TimeOfDay) => void;
  onToggleSound: () => void;
  onSetSoundVolume: (vol: number) => void;
  onToggleTouchControls: () => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  timeOfDay,
  soundEnabled,
  soundVolume,
  touchControls,
  onClose,
  onSetTimeOfDay,
  onToggleSound,
  onSetSoundVolume,
  onToggleTouchControls,
  onResetProgress,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-black">
              ⚙️
            </div>
            <div>
              <h2 className="text-xl font-black text-white">SIMULATOR SETTINGS</h2>
              <p className="text-xs text-slate-400 font-semibold">Environment, audio, and gameplay preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SETTINGS OPTIONS */}
        <div className="p-6 flex flex-col gap-6">
          {/* Time of Day */}
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Time of Day & Atmosphere
            </span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'day' as const, label: 'Sunny Day', icon: Sun, color: 'text-amber-400' },
                { id: 'sunset' as const, label: 'Golden Hour', icon: Sunset, color: 'text-orange-400' },
                { id: 'night' as const, label: 'Starry Night', icon: Moon, color: 'text-indigo-400' },
              ].map((t) => {
                const Icon = t.icon;
                const active = timeOfDay === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      soundManager.playClick();
                      onSetTimeOfDay(t.id);
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                      active
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${t.color}`} />
                    <span className="text-xs font-bold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound FX & Engine */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Sound FX & Engine Audio
              </span>
              <button
                onClick={onToggleSound}
                className="text-xs font-bold text-amber-400 flex items-center gap-1 hover:underline"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-4">
              <span className="text-xs text-slate-400 font-bold min-w-[50px]">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                disabled={!soundEnabled}
                onChange={(e) => onSetSoundVolume(parseFloat(e.target.value))}
                className="flex-1 accent-amber-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-300 w-10 text-right">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Mobile Touch Controls Force Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-bold text-white">Touch Controls Overlay</div>
                <div className="text-xs text-slate-400">Force display on-screen steering pedals</div>
              </div>
            </div>

            <button
              onClick={onToggleTouchControls}
              className={`w-12 h-6 rounded-full transition p-1 flex items-center ${
                touchControls ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Reset Save Data */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Reset starting balance to ₹5,000 and default vehicles.
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all money, unlocked vehicles, and mission progress?')) {
                  onResetProgress();
                }
              }}
              className="px-3 py-2 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Game</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
