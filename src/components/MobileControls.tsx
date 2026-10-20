/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, ArrowRight, Camera, Volume2, RotateCcw, Music } from 'lucide-react';
import { InputState } from '../types/game';

interface MobileControlsProps {
  inputState: React.MutableRefObject<InputState>;
  onCycleCamera: () => void;
  onResetVehicle: () => void;
  onCycleTrolley?: () => void;
  onToggleDJ?: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  inputState,
  onCycleCamera,
  onResetVehicle,
  onCycleTrolley,
  onToggleDJ,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex justify-between items-end p-3 pb-16 md:hidden">
      {/* LEFT: Steering controls & Quick attachment buttons */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        {/* Quick Trolley & DJ mobile buttons */}
        <div className="flex items-center gap-2">
          {onCycleTrolley && (
            <button
              onClick={onCycleTrolley}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-700/85 active:bg-emerald-600 text-white border border-emerald-500 shadow-lg text-[10px] font-black flex items-center gap-1 active:scale-95"
            >
              <span>🌾</span>
              <span>Trolley</span>
            </button>
          )}

          {onToggleDJ && (
            <button
              onClick={onToggleDJ}
              className="px-2.5 py-1.5 rounded-xl bg-rose-700/85 active:bg-rose-600 text-white border border-rose-500 shadow-lg text-[10px] font-black flex items-center gap-1 active:scale-95"
            >
              <Music className="w-3 h-3" />
              <span>DJ Bass</span>
            </button>
          )}
        </div>

        {/* Steer Left & Right Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onPointerDown={() => { inputState.current.steer = -1; }}
            onPointerUp={() => { inputState.current.steer = 0; }}
            onPointerLeave={() => { inputState.current.steer = 0; }}
            className="w-16 h-16 rounded-2xl bg-slate-900/85 active:bg-amber-500 border-2 border-slate-700 active:border-amber-400 text-white active:text-slate-950 flex items-center justify-center shadow-2xl transition-transform active:scale-90"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>

          <button
            onPointerDown={() => { inputState.current.steer = 1; }}
            onPointerUp={() => { inputState.current.steer = 0; }}
            onPointerLeave={() => { inputState.current.steer = 0; }}
            className="w-16 h-16 rounded-2xl bg-slate-900/85 active:bg-amber-500 border-2 border-slate-700 active:border-amber-400 text-white active:text-slate-950 flex items-center justify-center shadow-2xl transition-transform active:scale-90"
          >
            <ArrowRight className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* CENTER-BOTTOM: Quick utility buttons */}
      <div className="flex items-center gap-2 pointer-events-auto mb-1">
        {/* Mobile Horn */}
        <button
          onPointerDown={() => { inputState.current.horn = true; }}
          onPointerUp={() => { inputState.current.horn = false; }}
          onPointerLeave={() => { inputState.current.horn = false; }}
          className="w-11 h-11 rounded-xl bg-amber-500/90 active:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg active:scale-90 font-black text-xs"
          title="Indian Horn"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        {/* Mobile Camera Switch */}
        <button
          onClick={onCycleCamera}
          className="w-11 h-11 rounded-xl bg-slate-800/90 text-cyan-300 border border-slate-700 flex items-center justify-center shadow-lg active:scale-90"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Reset / Unflip Vehicle */}
        <button
          onClick={onResetVehicle}
          className="w-11 h-11 rounded-xl bg-slate-800/90 text-slate-300 border border-slate-700 flex items-center justify-center shadow-lg active:scale-90"
          title="Reset vehicle position"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* RIGHT: Gas, Brake & Handbrake pedals */}
      <div className="flex items-end gap-2.5 pointer-events-auto">
        {/* Footbrake / Reverse */}
        <button
          onPointerDown={() => {
            inputState.current.throttle = -1;
            inputState.current.brake = true;
          }}
          onPointerUp={() => {
            inputState.current.throttle = 0;
            inputState.current.brake = false;
          }}
          onPointerLeave={() => {
            inputState.current.throttle = 0;
            inputState.current.brake = false;
          }}
          className="w-13 h-20 rounded-2xl bg-rose-600/90 active:bg-rose-500 border-2 border-rose-400 text-white font-black text-xs flex flex-col items-center justify-center shadow-2xl active:scale-95"
        >
          <span>BRAKE</span>
          <span className="text-[9px] opacity-75">REV</span>
        </button>

        {/* Handbrake / Drift */}
        <button
          onPointerDown={() => { inputState.current.handbrake = true; }}
          onPointerUp={() => { inputState.current.handbrake = false; }}
          onPointerLeave={() => { inputState.current.handbrake = false; }}
          className="w-11 h-14 rounded-xl bg-amber-600/80 active:bg-amber-500 border border-amber-400 text-white font-black text-[10px] flex items-center justify-center shadow-lg active:scale-95"
        >
          (P)
        </button>

        {/* Accelerator / Gas Pedal */}
        <button
          onPointerDown={() => { inputState.current.throttle = 1; }}
          onPointerUp={() => { inputState.current.throttle = 0; }}
          onPointerLeave={() => { inputState.current.throttle = 0; }}
          className="w-15 h-28 rounded-2xl bg-emerald-600/90 active:bg-emerald-500 border-2 border-emerald-400 text-white font-black text-sm flex flex-col items-center justify-center shadow-2xl active:scale-95"
        >
          <span>GAS</span>
          <span className="text-[10px] opacity-75">GO</span>
        </button>
      </div>
    </div>
  );
};
