/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, CheckCircle, Clock, MapPin, Trophy, Play } from 'lucide-react';
import { Mission } from '../types/game';
import { MISSIONS_LIST } from '../game/MissionSystem';
import { soundManager } from '../audio/SoundManager';

interface MissionsModalProps {
  completedMissions: string[];
  activeMissionId?: string;
  onClose: () => void;
  onStartMission: (mission: Mission) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  completedMissions,
  activeMissionId,
  onClose,
  onStartMission,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              🏆
            </div>
            <div>
              <h2 className="text-xl font-black text-white">SIMULATOR MISSIONS & CONTRACTS</h2>
              <p className="text-xs text-slate-400 font-semibold">
                Complete countryside & highway jobs to earn in-game ₹ cash
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              Completed: {completedMissions.length} / {MISSIONS_LIST.length}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MISSION CARDS LIST */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {MISSIONS_LIST.map((mission, idx) => {
            const isCompleted = completedMissions.includes(mission.id);
            const isActive = activeMissionId === mission.id;

            return (
              <div
                key={mission.id}
                className={`p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500'
                    : isCompleted
                    ? 'bg-slate-800/30 border-emerald-500/30'
                    : 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600'
                }`}
              >
                {/* Info */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 shrink-0 text-sm">
                    0{idx + 1}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">{mission.title}</h3>
                      <span className="text-xs font-semibold text-amber-400">{mission.subtitle}</span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-1 max-w-xl">{mission.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>Destination: <strong className="text-white">{mission.targetName}</strong></span>
                      </div>
                      {mission.timeLimit && (
                        <div className="flex items-center gap-1 text-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Time Limit: {mission.timeLimit} seconds</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reward & Start Action */}
                <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-700/50">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Reward</div>
                    <div className="text-xl font-black text-white flex items-center gap-1">
                      <span className="text-amber-400">₹</span>
                      <span>{mission.reward.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onStartMission(mission);
                    }}
                    className={`px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition active:scale-95 ${
                      isActive
                        ? 'bg-amber-600 text-slate-950'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isActive ? 'RESTART' : isCompleted ? 'PLAY AGAIN' : 'ACCEPT'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
