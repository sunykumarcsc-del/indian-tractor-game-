/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { VEHICLE_CONFIGS } from './game/VehicleFactory';
import { soundManager } from './audio/SoundManager';
import {
  CameraMode,
  InputState,
  Mission,
  PlayerSaveData,
  TimeOfDay,
  VehicleType,
  TractorModSettings,
  TrolleyType,
  DEFAULT_TRACTOR_MODS,
} from './types/game';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { MainMenu } from './components/MainMenu';
import { GarageModal } from './components/GarageModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';

const SAVE_KEY = 'indian_village_sim_v2_save';

const DEFAULT_SAVE: PlayerSaveData = {
  money: 5000,
  selectedVehicleId: 'tractor',
  ownedVehicles: ['tractor', 'tractor_green', 'hatchback'],
  vehicleColors: {
    tractor: '#dc2626',
    tractor_green: '#16a34a',
    tractor_blue: '#1d4ed8',
    tractor_classic: '#0284c7',
    tractor_mahindra: '#b91c1c',
    tractor_sonalika: '#0f172a',
    tractor_massey: '#ef4444',
    hatchback: '#2563eb',
    sedan: '#f8fafc',
    suv: '#0f172a',
    sports: '#f97316',
    motorcycle: '#0f172a',
    truck: '#ca8a04',
  },
  vehicleUpgrades: {
    tractor: { engine: 0, brakes: 0, handling: 0 },
    tractor_green: { engine: 0, brakes: 0, handling: 0 },
    tractor_blue: { engine: 0, brakes: 0, handling: 0 },
    tractor_classic: { engine: 0, brakes: 0, handling: 0 },
    tractor_mahindra: { engine: 0, brakes: 0, handling: 0 },
    tractor_sonalika: { engine: 0, brakes: 0, handling: 0 },
    tractor_massey: { engine: 0, brakes: 0, handling: 0 },
    hatchback: { engine: 0, brakes: 0, handling: 0 },
    sedan: { engine: 0, brakes: 0, handling: 0 },
    suv: { engine: 0, brakes: 0, handling: 0 },
    sports: { engine: 0, brakes: 0, handling: 0 },
    motorcycle: { engine: 0, brakes: 0, handling: 0 },
    truck: { engine: 0, brakes: 0, handling: 0 },
  },
  tractorMods: {
    tractor: { ...DEFAULT_TRACTOR_MODS },
    tractor_green: {
      ...DEFAULT_TRACTOR_MODS,
      cabinStyle: 'enclosed_glass',
      trolleyType: 'grain_trolley',
      rimColor: 'yellow',
      frontAttachment: 'heavy_bumper',
    },
    tractor_blue: {
      ...DEFAULT_TRACTOR_MODS,
      cabinStyle: 'enclosed_glass',
      trolleyType: 'cultivator',
      rimColor: 'white',
      frontAttachment: 'none',
    },
    tractor_classic: {
      ...DEFAULT_TRACTOR_MODS,
      cabinStyle: 'open_rollbar',
      trolleyType: 'sugarcane_trolley',
      rimColor: 'white',
      silencerStyle: 'straight_chrome',
    },
    tractor_mahindra: {
      ...DEFAULT_TRACTOR_MODS,
      cabinStyle: 'open_canopy_dj',
      trolleyType: 'tanker',
      rimColor: 'yellow',
      frontAttachment: 'heavy_bumper',
    },
    tractor_sonalika: {
      ...DEFAULT_TRACTOR_MODS,
      cabinStyle: 'enclosed_glass',
      trolleyType: 'grain_trolley',
      rimColor: 'black',
      tyreStyle: 'dual_rear',
    },
    tractor_massey: {
      ...DEFAULT_TRACTOR_MODS,
      cabinStyle: 'sunshade_flat',
      trolleyType: 'cultivator',
      rimColor: 'chrome',
      frontAttachment: 'none',
    },
  },
  completedMissions: [],
  soundEnabled: true,
  soundVolume: 0.8,
  timeOfDay: 'day',
  touchControls: false,
};

function loadSave(): PlayerSaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        tractorMods: { ...DEFAULT_SAVE.tractorMods, ...(parsed.tractorMods || {}) },
      };
    }
  } catch {}
  return DEFAULT_SAVE;
}

function persistSave(data: PlayerSaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Player Saved Progression State
  const [saveData, setSaveData] = useState<PlayerSaveData>(loadSave);

  // Active Screen & Modal States
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [activeModal, setActiveModal] = useState<'garage' | 'missions' | 'settings' | 'pause' | null>(null);
  const [hasStartedDriving, setHasStartedDriving] = useState(false);
  const [isDJPlaying, setIsDJPlaying] = useState(false);

  // Realtime HUD States (throttled to avoid re-rendering game canvas)
  const [speedKmH, setSpeedKmH] = useState(0);
  const [gear, setGear] = useState('N');
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missionDistance, setMissionDistance] = useState<number | undefined>(undefined);
  const [missionTime, setMissionTime] = useState<number | undefined>(undefined);
  const [tollNotification, setTollNotification] = useState<string | null>(null);
  const [policeAlert, setPoliceAlert] = useState<{ fine: number; reason: string } | null>(null);
  const [missionSuccessBanner, setMissionSuccessBanner] = useState<string | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: -240, z: -220, heading: 0 });

  // Input state container
  const inputState = useRef<InputState>({
    throttle: 0,
    steer: 0,
    brake: false,
    handbrake: false,
    horn: false,
    headlights: false,
    resetVehicle: false,
  });

  // Save changes to localStorage whenever saveData updates
  useEffect(() => {
    persistSave(saveData);
  }, [saveData]);

  // Sync sound settings with SoundManager
  useEffect(() => {
    soundManager.setMuted(!saveData.soundEnabled);
    soundManager.setVolume(saveData.soundVolume);
  }, [saveData.soundEnabled, saveData.soundVolume]);

  // Mount Three.js Engine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const initialMods = saveData.tractorMods[saveData.selectedVehicleId] || DEFAULT_TRACTOR_MODS;

    const engine = new GameEngine(canvasMountRef.current, {
      onSpeedUpdate: (speed, g) => {
        setSpeedKmH(speed);
        setGear(g);
      },
      onTollDeduction: (amount, status) => {
        if (amount > 0) {
          setSaveData((prev) => ({ ...prev, money: Math.max(0, prev.money - amount) }));
        }
        setTollNotification(status);
        setTimeout(() => setTollNotification(null), 5000);
      },
      onPoliceAlert: (fine, reason) => {
        setSaveData((prev) => ({ ...prev, money: Math.max(0, prev.money - fine) }));
        setPoliceAlert({ fine, reason });
        setTimeout(() => setPoliceAlert(null), 6000);
      },
      onMissionComplete: (reward, title) => {
        setSaveData((prev) => {
          const completed = activeMission ? [...new Set([...prev.completedMissions, activeMission.id])] : prev.completedMissions;
          return {
            ...prev,
            money: prev.money + reward,
            completedMissions: completed,
          };
        });
        setActiveMission(null);
        setMissionSuccessBanner(`+₹${reward.toLocaleString('en-IN')} Earned for "${title}"`);
        setTimeout(() => setMissionSuccessBanner(null), 6000);
      },
      onMissionFail: (reason) => {
        setActiveMission(null);
        alert(reason);
      },
      onPlayerPosUpdate: (x, z, heading) => {
        setPlayerPos({ x, z, heading });
        if (engineRef.current && engineRef.current.missions.activeMission) {
          setMissionDistance(engineRef.current.missions.getDistanceToTarget(engineRef.current.missions.beaconMesh.position));
          setMissionTime(engineRef.current.missions.remainingTime);
        }
      },
    });

    engineRef.current = engine;
    engine.isShowcaseMode = true;
    engine.spawnVehicle(saveData.selectedVehicleId, saveData.vehicleColors[saveData.selectedVehicleId], initialMods);
    engine.applyTimeOfDay(saveData.timeOfDay);

    // Continuous input tick for physics loop
    let lastTime = performance.now();
    let animId: number;

    const gameLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (engineRef.current) {
        engineRef.current.update(dt, inputState.current, saveData.money);
      }
      animId = requestAnimationFrame(gameLoop);
    };
    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Actions
  const cycleCamera = useCallback(() => {
    soundManager.playClick();
    const modes: CameraMode[] = ['chase', 'hood', 'top', 'cinematic'];
    const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setCameraMode(nextMode);
    if (engineRef.current) {
      engineRef.current.setCameraMode(nextMode);
    }
  }, [cameraMode]);

  const cycleTimeOfDay = useCallback(() => {
    soundManager.playClick();
    const cycles: TimeOfDay[] = ['day', 'sunset', 'night'];
    const nextIdx = (cycles.indexOf(saveData.timeOfDay) + 1) % cycles.length;
    const nextTod = cycles[nextIdx];
    setSaveData((prev) => ({ ...prev, timeOfDay: nextTod }));
    if (engineRef.current) {
      engineRef.current.applyTimeOfDay(nextTod);
    }
  }, [saveData.timeOfDay]);

  const toggleSound = useCallback(() => {
    soundManager.playClick();
    setSaveData((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const resetVehiclePosition = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.teleport(-240, 0.5, -220, 0);
      soundManager.playClick();
    }
  }, []);

  const handleCycleTrolley = useCallback(() => {
    soundManager.playClick();
    const currentMods = saveData.tractorMods[saveData.selectedVehicleId] || { ...DEFAULT_TRACTOR_MODS };
    const trolleyOptions: TrolleyType[] = ['grain_trolley', 'sugarcane_trolley', 'tanker', 'cultivator', 'none'];
    const curIdx = trolleyOptions.indexOf(currentMods.trolleyType);
    const nextType = trolleyOptions[(curIdx + 1) % trolleyOptions.length];
    const newMods: TractorModSettings = { ...currentMods, trolleyType: nextType };

    setSaveData((prev) => ({
      ...prev,
      tractorMods: {
        ...prev.tractorMods,
        [prev.selectedVehicleId]: newMods,
      },
    }));

    if (engineRef.current) {
      engineRef.current.updateTractorMods(newMods);
    }
  }, [saveData.selectedVehicleId, saveData.tractorMods]);

  const handleToggleDJ = useCallback(() => {
    soundManager.playClick();
    if (soundManager.isDJPlaying()) {
      soundManager.stopDJMusic();
      setIsDJPlaying(false);
    } else {
      soundManager.startDJMusic();
      setIsDJPlaying(true);
    }
  }, []);

  // Desktop Keyboard Input Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputState.current.throttle = 1;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputState.current.throttle = -1;
          inputState.current.brake = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputState.current.steer = -1;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputState.current.steer = 1;
          break;
        case 'Space':
          inputState.current.handbrake = true;
          e.preventDefault();
          break;
        case 'KeyH':
          inputState.current.horn = true;
          break;
        case 'KeyL':
          inputState.current.headlights = !inputState.current.headlights;
          break;
        case 'KeyC':
          cycleCamera();
          break;
        case 'KeyR':
          resetVehiclePosition();
          break;
        case 'KeyT':
          handleCycleTrolley();
          break;
        case 'KeyJ':
          handleToggleDJ();
          break;
        case 'Escape':
        case 'KeyP':
          if (screen === 'playing') {
            setActiveModal((prev) => (prev === 'pause' ? null : 'pause'));
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          if (inputState.current.throttle > 0) inputState.current.throttle = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          if (inputState.current.throttle < 0) inputState.current.throttle = 0;
          inputState.current.brake = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          if (inputState.current.steer < 0) inputState.current.steer = 0;
          break;
        case 'KeyD':
        case 'ArrowRight':
          if (inputState.current.steer > 0) inputState.current.steer = 0;
          break;
        case 'Space':
          inputState.current.handbrake = false;
          break;
        case 'KeyH':
          inputState.current.horn = false;
          break;
      }
    };

    const handleBlur = () => {
      inputState.current.throttle = 0;
      inputState.current.steer = 0;
      inputState.current.brake = false;
      inputState.current.handbrake = false;
      inputState.current.horn = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [screen, cycleCamera, resetVehiclePosition, handleCycleTrolley, handleToggleDJ]);

  const handleStartGame = useCallback(() => {
    soundManager.playClick();
    setScreen('playing');
    setHasStartedDriving(true);
    if (engineRef.current) {
      engineRef.current.isShowcaseMode = false;
      engineRef.current.setCameraMode('chase');
      setCameraMode('chase');
    }
    soundManager.startEngine(saveData.selectedVehicleId);
  }, [saveData.selectedVehicleId]);

  const handleResumeGame = useCallback(() => {
    soundManager.playClick();
    setScreen('playing');
    setActiveModal(null);
    if (engineRef.current) {
      engineRef.current.isShowcaseMode = false;
    }
    soundManager.startEngine(saveData.selectedVehicleId);
  }, [saveData.selectedVehicleId]);

  const handleSelectVehicle = useCallback(
    (id: VehicleType) => {
      setSaveData((prev) => ({ ...prev, selectedVehicleId: id }));
      if (engineRef.current) {
        const mods = saveData.tractorMods[id] || DEFAULT_TRACTOR_MODS;
        engineRef.current.spawnVehicle(id, saveData.vehicleColors[id], mods);
      }
    },
    [saveData.vehicleColors, saveData.tractorMods]
  );

  const handleBuyVehicle = useCallback(
    (id: VehicleType, price: number) => {
      setSaveData((prev) => ({
        ...prev,
        money: prev.money - price,
        ownedVehicles: [...new Set([...prev.ownedVehicles, id])],
        selectedVehicleId: id,
      }));
      if (engineRef.current) {
        const mods = saveData.tractorMods[id] || DEFAULT_TRACTOR_MODS;
        engineRef.current.spawnVehicle(id, saveData.vehicleColors[id], mods);
      }
    },
    [saveData.vehicleColors, saveData.tractorMods]
  );

  const handleChangeColor = useCallback((id: VehicleType, color: string) => {
    setSaveData((prev) => ({
      ...prev,
      vehicleColors: { ...prev.vehicleColors, [id]: color },
    }));
    if (engineRef.current) {
      engineRef.current.setVehicleColor(color);
    }
  }, []);

  const handleUpdateTractorMods = useCallback((vehicleId: VehicleType, mods: TractorModSettings) => {
    setSaveData((prev) => ({
      ...prev,
      tractorMods: {
        ...prev.tractorMods,
        [vehicleId]: mods,
      },
    }));
    if (engineRef.current && vehicleId === saveData.selectedVehicleId) {
      engineRef.current.updateTractorMods(mods);
    }
  }, [saveData.selectedVehicleId]);

  const handleUpgradeVehicle = useCallback((id: VehicleType, cat: 'engine' | 'brakes' | 'handling', cost: number) => {
    setSaveData((prev) => {
      const currentUp = prev.vehicleUpgrades[id] || { engine: 0, brakes: 0, handling: 0 };
      return {
        ...prev,
        money: prev.money - cost,
        vehicleUpgrades: {
          ...prev.vehicleUpgrades,
          [id]: { ...currentUp, [cat]: currentUp[cat] + 1 },
        },
      };
    });
  }, []);

  const handleStartMission = useCallback((mission: Mission) => {
    setActiveMission(mission);
    setActiveModal(null);
    setScreen('playing');
    if (engineRef.current) {
      engineRef.current.isShowcaseMode = false;
      engineRef.current.missions.startMission(mission, (x, y, z) => {
        engineRef.current?.teleport(x, y + 0.5, z);
      });
    }
    soundManager.startEngine(saveData.selectedVehicleId);
  }, [saveData.selectedVehicleId]);

  const handleCancelMission = useCallback(() => {
    setActiveMission(null);
    if (engineRef.current) {
      engineRef.current.missions.cancelMission();
    }
  }, []);

  const currentVehicleConfig = VEHICLE_CONFIGS[saveData.selectedVehicleId] || VEHICLE_CONFIGS.tractor;
  const currentVehicleMods = saveData.tractorMods[saveData.selectedVehicleId] || DEFAULT_TRACTOR_MODS;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WEBGL CANVAS ISOLATED MOUNT */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* 1. MAIN MENU SCREEN */}
      {screen === 'menu' && (
        <MainMenu
          money={saveData.money}
          selectedVehicleId={saveData.selectedVehicleId}
          ownedVehicles={saveData.ownedVehicles}
          hasGameInProgress={hasStartedDriving}
          soundMuted={!saveData.soundEnabled}
          onSelectVehicle={handleSelectVehicle}
          onStartGame={handleStartGame}
          onResumeGame={handleResumeGame}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenMissions={() => setActiveModal('missions')}
          onOpenSettings={() => setActiveModal('settings')}
          onToggleSound={toggleSound}
        />
      )}

      {/* 2. PLAYING HUD & CONTROLS */}
      {screen === 'playing' && (
        <>
          <HUD
            speedKmH={speedKmH}
            gear={gear}
            money={saveData.money}
            vehicleConfig={currentVehicleConfig}
            cameraMode={cameraMode}
            timeOfDay={saveData.timeOfDay}
            soundMuted={!saveData.soundEnabled}
            currentTrolley={currentVehicleMods.trolleyType}
            isDJPlaying={isDJPlaying}
            activeMissionTitle={activeMission?.title}
            missionDistance={missionDistance}
            missionTimeRemaining={missionTime}
            tollNotification={tollNotification}
            policeAlert={policeAlert}
            missionSuccessNotification={missionSuccessBanner}
            playerPos={playerPos}
            onToggleSound={toggleSound}
            onCycleCamera={cycleCamera}
            onCycleTimeOfDay={cycleTimeOfDay}
            onCycleTrolley={handleCycleTrolley}
            onToggleDJ={handleToggleDJ}
            onTriggerHorn={() => {
              inputState.current.horn = true;
              setTimeout(() => { inputState.current.horn = false; }, 300);
            }}
            onTriggerHeadlights={() => {
              inputState.current.headlights = !inputState.current.headlights;
            }}
            onOpenPause={() => setActiveModal('pause')}
            onCancelMission={handleCancelMission}
            onOpenMissions={() => setActiveModal('missions')}
            onOpenGarage={() => setActiveModal('garage')}
          />

          {/* Mobile Touch Overlay */}
          <MobileControls
            inputState={inputState}
            onCycleCamera={cycleCamera}
            onResetVehicle={resetVehiclePosition}
            onCycleTrolley={handleCycleTrolley}
            onToggleDJ={handleToggleDJ}
          />
        </>
      )}

      {/* 3. MODAL OVERLAYS */}
      {activeModal === 'garage' && (
        <GarageModal
          money={saveData.money}
          ownedVehicles={saveData.ownedVehicles}
          selectedVehicleId={saveData.selectedVehicleId}
          vehicleColors={saveData.vehicleColors}
          vehicleUpgrades={saveData.vehicleUpgrades}
          tractorMods={saveData.tractorMods}
          onClose={() => setActiveModal(null)}
          onSelectVehicle={handleSelectVehicle}
          onBuyVehicle={handleBuyVehicle}
          onChangeColor={handleChangeColor}
          onUpgradeVehicle={handleUpgradeVehicle}
          onUpdateTractorMods={handleUpdateTractorMods}
        />
      )}

      {activeModal === 'missions' && (
        <MissionsModal
          completedMissions={saveData.completedMissions}
          activeMissionId={activeMission?.id}
          onClose={() => setActiveModal(null)}
          onStartMission={handleStartMission}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          timeOfDay={saveData.timeOfDay}
          soundEnabled={saveData.soundEnabled}
          soundVolume={saveData.soundVolume}
          touchControls={saveData.touchControls}
          onClose={() => setActiveModal(null)}
          onSetTimeOfDay={(tod) => {
            setSaveData((prev) => ({ ...prev, timeOfDay: tod }));
            if (engineRef.current) engineRef.current.applyTimeOfDay(tod);
          }}
          onToggleSound={toggleSound}
          onSetSoundVolume={(vol) => {
            setSaveData((prev) => ({ ...prev, soundVolume: vol }));
          }}
          onToggleTouchControls={() => {
            setSaveData((prev) => ({ ...prev, touchControls: !prev.touchControls }));
          }}
          onResetProgress={() => {
            setSaveData(DEFAULT_SAVE);
            localStorage.removeItem(SAVE_KEY);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'pause' && (
        <PauseModal
          onResume={() => setActiveModal(null)}
          onResetVehicle={resetVehiclePosition}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenMissions={() => setActiveModal('missions')}
          onOpenSettings={() => setActiveModal('settings')}
          onMainMenu={() => {
            setActiveModal(null);
            setScreen('menu');
            if (engineRef.current) engineRef.current.isShowcaseMode = true;
            soundManager.stopEngine();
            soundManager.stopDJMusic();
            setIsDJPlaying(false);
          }}
        />
      )}
    </div>
  );
}
