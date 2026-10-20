/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Camera,
  Sun,
  Sunset,
  Moon,
  Pause,
  AlertTriangle,
  Compass,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CameraMode, TimeOfDay, VehicleConfig } from '../types/game';

interface HUDProps {
  speedKmH: number;
  gear: string;
  money: number;
  vehicleConfig: VehicleConfig;
  cameraMode: CameraMode;
  timeOfDay: TimeOfDay;
  soundMuted: boolean;
  activeMissionTitle?: string;
  missionDistance?: number;
  missionTimeRemaining?: number;
  tollNotification?: string | null;
  policeAlert?: { fine: number; reason: string } | null;
  missionSuccessNotification?: string | null;
  playerPos: { x: number; z: number; heading: number };
  currentTrolley?: import('../types/game').TrolleyType;
  isDJPlaying?: boolean;
  onCycleTrolley?: () => void;
  onToggleDJ?: () => void;
  onToggleSound: () => void;
  onCycleCamera: () => void;
  onCycleTimeOfDay: () => void;
  onTriggerHorn: () => void;
  onTriggerHeadlights: () => void;
  onOpenPause: () => void;
  onCancelMission: () => void;
  onOpenMissions: () => void;
  onOpenGarage: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  speedKmH,
  gear,
  money,
  vehicleConfig,
  cameraMode,
  timeOfDay,
  soundMuted,
  activeMissionTitle,
  missionDistance,
  missionTimeRemaining,
  tollNotification,
  policeAlert,
  missionSuccessNotification,
  playerPos,
  currentTrolley,
  isDJPlaying,
  onCycleTrolley,
  onToggleDJ,
  onToggleSound,
  onCycleCamera,
  onCycleTimeOfDay,
  onTriggerHorn,
  onTriggerHeadlights,
  onOpenPause,
  onCancelMission,
  onOpenMissions,
  onOpenGarage,
}) => {
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  // Speedometer calculation
  const maxDialSpeed = Math.max(120, vehicleConfig.maxSpeed);
  const speedRatio = Math.min(1, speedKmH / maxDialSpeed);
  const needleRotation = -120 + speedRatio * 240; // -120deg to +120deg

  // Minimap coordinate mapping (-450 to +450 world space mapped to 0-140px)
  const mapScale = 140 / 800;
  const mapPlayerX = 70 + playerPos.x * mapScale;
  const mapPlayerY = 70 + playerPos.z * mapScale;

  const landmarks = [
    { name: 'Village', x: -240, z: -220, color: '#f59e0b' },
    { name: 'Mandir', x: -290, z: -280, color: '#f97316' },
    { name: 'Dhaba', x: -120, z: -110, color: '#ef4444' },
    { name: 'Toll', x: -20, z: -10, color: '#10b981' },
    { name: 'Fuel', x: 80, z: 70, color: '#3b82f6' },
    { name: 'City', x: 260, z: 220, color: '#8b5cf6' },
    { name: 'Airport', x: -220, z: 260, color: '#06b6d4' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* TOP BAR: Money, Vehicle Badge, and Pause */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20">
        {/* Left: Money & Vehicle */}
        <div className="flex flex-col gap-2">
          {/* Indian Rupee Balance Card */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-amber-500/40 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-amber-400 font-black text-2xl tracking-tight">₹</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-amber-200/70 font-semibold tracking-wider uppercase">Cash Balance</span>
              <span className="text-xl font-black text-white tabular-nums tracking-wide">
                {money.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Current Vehicle Badge */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: vehicleConfig.color }} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-100">{vehicleConfig.name}</span>
              <span className="text-[10px] text-slate-400">{vehicleConfig.hindiName}</span>
            </div>
          </div>
        </div>

        {/* Center: Notifications & Alerts */}
        <div className="flex flex-col items-center gap-2 max-w-md w-full px-4">
          {/* Police Alert Banner */}
          {policeAlert && (
            <div className="bg-rose-950/90 border-2 border-rose-500 text-rose-100 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider">Police Fine Deducted</div>
                <div className="text-sm font-black text-white">
                  -₹{policeAlert.fine} • {policeAlert.reason}
                </div>
              </div>
            </div>
          )}

          {/* Highway Toll Notification */}
          {tollNotification && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-100 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-bold">{tollNotification}</span>
            </div>
          )}

          {/* Mission Success Celebration */}
          {missionSuccessNotification && (
            <div className="bg-amber-950/90 border-2 border-amber-400 text-amber-100 px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-amber-300">MISSION COMPLETED!</div>
                <div className="text-sm font-black text-white">{missionSuccessNotification}</div>
              </div>
            </div>
          )}

          {/* Active Mission HUD Tracker */}
          {activeMissionTitle && (
            <div className="bg-slate-900/90 border border-amber-500/60 rounded-xl px-4 py-2 shadow-lg flex items-center justify-between w-full max-w-sm pointer-events-auto">
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Active Objective</span>
                <span className="text-sm font-bold text-white truncate max-w-[200px]">{activeMissionTitle}</span>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                  {missionDistance !== undefined && (
                    <span className="font-semibold text-amber-300">{missionDistance}m away</span>
                  )}
                  {missionTimeRemaining !== undefined && (
                    <span className={`font-mono font-bold ${missionTimeRemaining < 20 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                      ⏱ {Math.ceil(missionTimeRemaining)}s
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onCancelMission}
                className="text-[10px] text-slate-400 hover:text-rose-400 bg-slate-800 px-2 py-1 rounded border border-slate-700 transition"
              >
                Abort
              </button>
            </div>
          )}
        </div>

        {/* Right: Minimap Radar & Pause Button */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPause}
              className="pointer-events-auto bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-xl border border-slate-700/60 shadow-lg transition active:scale-95"
              title="Pause Game (Esc)"
            >
              <Pause className="w-5 h-5 text-amber-400" />
            </button>
          </div>

          {/* Minimap Radar */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 shadow-xl w-[148px] h-[148px] relative overflow-hidden">
            {/* Radar Grid lines */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 rounded-full border border-slate-600/30" />
            </div>

            {/* Landmarks on Minimap */}
            {landmarks.map((lm) => {
              const lx = 70 + lm.x * mapScale;
              const ly = 70 + lm.z * mapScale;
              return (
                <div
                  key={lm.name}
                  className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${lx}px`, top: `${ly}px`, backgroundColor: lm.color }}
                  title={lm.name}
                >
                  <span className="absolute left-2.5 top-0 text-[8px] font-bold text-slate-300 whitespace-nowrap opacity-75">
                    {lm.name}
                  </span>
                </div>
              );
            })}

            {/* Player Indicator Arrow */}
            <div
              className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform"
              style={{
                left: `${mapPlayerX}px`,
                top: `${mapPlayerY}px`,
                transform: `translate(-50%, -50%) rotate(${playerPos.heading}rad)`,
              }}
            >
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-amber-400" />
            </div>

            {/* Compass badge */}
            <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[8px] font-mono text-slate-400">
              <Compass className="w-2.5 h-2.5 text-amber-400" />
              <span>RADAR</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM LEFT: Analog & Digital Speedometer Gauge */}
      <div className="absolute bottom-6 left-6 z-20 flex items-end gap-3">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex flex-col items-center min-w-[140px]">
          {/* Digital Readout */}
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
              {speedKmH}
            </span>
            <span className="text-xs font-bold text-amber-400 uppercase">KM/H</span>
          </div>

          {/* Analog Dial Gauge Arc */}
          <div className="relative w-28 h-14 mt-1 overflow-hidden flex justify-center">
            <div className="w-28 h-28 rounded-full border-4 border-slate-800 border-t-amber-500 border-r-amber-400 absolute top-0" />
            {/* Needle */}
            <div
              className="w-1 h-12 bg-rose-500 origin-bottom absolute bottom-0 transition-transform duration-75"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            />
            <div className="w-3 h-3 rounded-full bg-white absolute bottom-0 -translate-y-1/2 shadow" />
          </div>

          {/* Gear readout & RPM bar */}
          <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Gear</span>
            <div className="flex items-center gap-1.5 font-black text-sm">
              <span className={gear === 'R' ? 'text-rose-400' : 'text-slate-600'}>R</span>
              <span className={gear === 'N' ? 'text-amber-400' : 'text-slate-600'}>N</span>
              <span className={gear === 'D' ? 'text-emerald-400' : 'text-slate-600'}>D</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: Unified Collapsible Control Dock (Per Three.js Constitution) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setControlsCollapsed(!controlsCollapsed)}
          className="pointer-events-auto bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-t-lg border-t border-x border-slate-700 shadow-md flex items-center gap-1 transition"
        >
          {controlsCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {/* Action Dock */}
        {!controlsCollapsed && (
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3">
            {/* Trolley Quick Toggle Button */}
            {onCycleTrolley && (
              <button
                onClick={onCycleTrolley}
                className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 px-3 py-2 rounded-xl border border-emerald-500/40 text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
                title="Attach / Cycle Trolley (T key)"
              >
                <span>🌾</span>
                <span>
                  {currentTrolley === 'grain_trolley'
                    ? 'Grain Trolley'
                    : currentTrolley === 'sugarcane_trolley'
                    ? 'Cane Trolley'
                    : currentTrolley === 'tanker'
                    ? 'Dairy Tanker'
                    : currentTrolley === 'cultivator'
                    ? 'DELEKS Hal'
                    : 'No Trolley'}
                </span>
              </button>
            )}

            {/* Punjabi DJ Bass Sound Button */}
            {onToggleDJ && (
              <button
                onClick={onToggleDJ}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition active:scale-95 flex items-center gap-1.5 ${
                  isDJPlaying
                    ? 'bg-rose-500 text-white border-rose-400 shadow-lg ring-2 ring-rose-400/80 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
                }`}
                title="Punjabi DJ Bass Sound (J key)"
              >
                <span>🔊</span>
                <span>{isDJPlaying ? 'DJ: ON (Bhangra)' : 'DJ: OFF'}</span>
              </button>
            )}

            {/* Horn Button (Authentic Indian Horn) */}
            <button
              onMouseDown={onTriggerHorn}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs uppercase shadow transition active:scale-95 flex items-center gap-1.5"
              title="Blow Horn (H key)"
            >
              <span>📢 Horn</span>
            </button>

            {/* Headlights Toggle */}
            <button
              onClick={onTriggerHeadlights}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition active:scale-95"
              title="Toggle Headlights (L key)"
            >
              <span className="text-xs font-bold">💡 Lights</span>
            </button>

            {/* Camera Switcher */}
            <button
              onClick={onCycleCamera}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-2 rounded-xl border border-slate-700 transition active:scale-95 flex items-center gap-1.5"
              title="Switch Camera (C key)"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase">{cameraMode}</span>
            </button>

            {/* Day / Sunset / Night Toggle */}
            <button
              onClick={onCycleTimeOfDay}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition active:scale-95"
              title="Change Time of Day"
            >
              {timeOfDay === 'day' && <Sun className="w-4 h-4 text-amber-400" />}
              {timeOfDay === 'sunset' && <Sunset className="w-4 h-4 text-orange-400" />}
              {timeOfDay === 'night' && <Moon className="w-4 h-4 text-indigo-300" />}
            </button>

            {/* Sound Mute */}
            <button
              onClick={onToggleSound}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition active:scale-95"
              title="Mute / Unmute Audio"
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Missions Quick Launcher */}
            <button
              onClick={onOpenMissions}
              className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 px-3 py-2 rounded-xl border border-amber-500/40 text-xs font-bold transition active:scale-95"
            >
              Missions
            </button>

            {/* Garage Quick Launcher */}
            <button
              onClick={onOpenGarage}
              className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-3 py-2 rounded-xl border border-blue-500/40 text-xs font-bold transition active:scale-95"
            >
              Garage
            </button>
          </div>
        )}
      </div>

      {/* DESKTOP CONTROLS HINT (Bottom-right, very subtle) */}
      <div className="absolute bottom-6 right-6 z-10 hidden md:flex flex-col items-end gap-1 text-[11px] text-slate-400 bg-slate-900/60 backdrop-blur px-3 py-2 rounded-xl border border-slate-800">
        <span className="font-semibold text-slate-300">WASD : Drive • T : Cycle Trolley • J : DJ Bass</span>
        <span>Space : Handbrake Drift • C : Camera • H : Indian Horn • L : Lights</span>
      </div>
    </div>
  );
};
