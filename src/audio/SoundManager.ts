/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private hornGain: GainNode | null = null;
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenTimer: number | null = null;
  private isEngineRunning: boolean = false;
  private isHornPlaying: boolean = false;
  private isSirenPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  // Engine synthesis: realistic sub-harmonic rumble + throttle buzz
  public startEngine(vehicleType: string = 'car') {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isEngineRunning) return;

    try {
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      // Base cylinder throb
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = vehicleType === 'tractor' || vehicleType === 'truck' ? 'sawtooth' : 'triangle';
      this.engineOsc1.frequency.setValueAtTime(vehicleType === 'tractor' ? 38 : 55, this.ctx.currentTime);

      // Higher harmonic buzz
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'sawtooth';
      this.engineOsc2.frequency.setValueAtTime(vehicleType === 'tractor' ? 76 : 110, this.ctx.currentTime);

      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(osc2Gain);
      osc2Gain.connect(this.engineFilter);

      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch {
      // Audio autoplay or web audio not permitted yet
    }
  }

  public updateEngine(speedKmH: number, maxSpeed: number, throttle: number, vehicleType: string = 'car') {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) {
      return;
    }

    const speedRatio = Math.min(1, Math.abs(speedKmH) / (maxSpeed || 100));
    const throttleRatio = Math.max(0, throttle);

    const baseFreq = vehicleType === 'tractor' ? 35 : vehicleType === 'truck' ? 42 : vehicleType === 'motorcycle' ? 80 : 52;
    const maxFreq = vehicleType === 'tractor' ? 140 : vehicleType === 'truck' ? 180 : vehicleType === 'sports' ? 340 : 240;

    const targetFreq = baseFreq + speedRatio * (maxFreq - baseFreq) + throttleRatio * 25;
    const targetFilter = 250 + speedRatio * 900 + throttleRatio * 400;

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.98, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.08);

    const targetVol = 0.08 + speedRatio * 0.12 + throttleRatio * 0.08;
    this.engineGain.gain.setTargetAtTime(targetVol, now, 0.06);
  }

  public stopEngine() {
    if (this.engineOsc1) {
      try { this.engineOsc1.stop(); } catch {}
      this.engineOsc1.disconnect();
      this.engineOsc1 = null;
    }
    if (this.engineOsc2) {
      try { this.engineOsc2.stop(); } catch {}
      this.engineOsc2.disconnect();
      this.engineOsc2 = null;
    }
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
    this.isEngineRunning = false;
  }

  // Authentic Indian Horn ("Horn OK Please" / Peep-peep / Dual Tone)
  public startHorn(type: 'truck' | 'car' | 'bike' | 'tractor' = 'truck') {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isHornPlaying) return;

    try {
      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

      let f1 = 440;
      let f2 = 554; // Major third
      if (type === 'truck') {
        f1 = 330;
        f2 = 415; // Deeper commanding dual tone
      } else if (type === 'bike') {
        f1 = 490;
        f2 = 490;
      } else if (type === 'tractor') {
        f1 = 280;
        f2 = 350;
      }

      this.hornOsc1 = this.ctx.createOscillator();
      this.hornOsc1.type = 'sawtooth';
      this.hornOsc1.frequency.setValueAtTime(f1, this.ctx.currentTime);

      this.hornOsc2 = this.ctx.createOscillator();
      this.hornOsc2.type = 'sawtooth';
      this.hornOsc2.frequency.setValueAtTime(f2, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime((f1 + f2) / 2, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.hornOsc1.connect(filter);
      this.hornOsc2.connect(filter);
      filter.connect(this.hornGain);
      this.hornGain.connect(this.masterGain);

      this.hornOsc1.start();
      this.hornOsc2.start();
      this.isHornPlaying = true;
    } catch {}
  }

  public stopHorn() {
    if (!this.ctx || !this.isHornPlaying) return;
    if (this.hornGain) {
      this.hornGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      setTimeout(() => {
        try { this.hornOsc1?.stop(); } catch {}
        try { this.hornOsc2?.stop(); } catch {}
        this.hornOsc1?.disconnect();
        this.hornOsc2?.disconnect();
        this.hornGain?.disconnect();
        this.hornOsc1 = null;
        this.hornOsc2 = null;
        this.hornGain = null;
        this.isHornPlaying = false;
      }, 50);
    }
  }

  // Police Siren Wail
  public startPoliceSiren() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isSirenPlaying) return;

    try {
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(650, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);
      this.sirenOsc.start();
      this.isSirenPlaying = true;

      let high = false;
      this.sirenTimer = window.setInterval(() => {
        if (!this.ctx || !this.sirenOsc) return;
        high = !high;
        const targetFreq = high ? 920 : 620;
        this.sirenOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.22);
      }, 350);
    } catch {}
  }

  public stopPoliceSiren() {
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (this.sirenOsc) {
      try { this.sirenOsc.stop(); } catch {}
      this.sirenOsc.disconnect();
      this.sirenOsc = null;
    }
    if (this.sirenGain) {
      this.sirenGain.disconnect();
      this.sirenGain = null;
    }
    this.isSirenPlaying = false;
  }

  // Authentic Punjabi DJ Sound System Beats (Dhol & Sub-Bass Groove)
  private djTimer: number | null = null;
  private isDJRunning: boolean = false;

  public startDJMusic() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isDJRunning) return;

    this.isDJRunning = true;
    let step = 0;
    const tempoMs = 145; // ~104 BPM Punjabi Bhangra groove

    const playBassDhol = () => {
      if (!this.ctx || !this.masterGain || !this.isDJRunning) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.23);
    };

    const playSnareSlap = (accent: boolean = false) => {
      if (!this.ctx || !this.masterGain || !this.isDJRunning) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(accent ? 440 : 330, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(accent ? 0.22 : 0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.11);
    };

    this.djTimer = window.setInterval(() => {
      const beat = step % 8;
      // Classic Chaal Bhangra beat pattern: Dha... Ge.. Na.. Tin..
      if (beat === 0 || beat === 3 || beat === 6) {
        playBassDhol();
      }
      if (beat === 2 || beat === 4 || beat === 7) {
        playSnareSlap(beat === 4);
      }
      step++;
    }, tempoMs);
  }

  public stopDJMusic() {
    if (this.djTimer) {
      clearInterval(this.djTimer);
      this.djTimer = null;
    }
    this.isDJRunning = false;
  }

  public isDJPlaying(): boolean {
    return this.isDJRunning;
  }

  // Crash impact sound
  public playCrash(intensity: number = 0.5) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      gain.gain.setValueAtTime(Math.min(0.4, 0.15 + intensity * 0.25), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {}
  }

  // Toll booth chime (Ding-Dong)
  public playTollChime() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      // High chime
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Low chime
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.18);
      gain2.gain.setValueAtTime(0.25, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.7);
    } catch {}
  }

  // Reward / Coins Jingle
  public playReward() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.36);
      });
    } catch {}
  }

  // UI Click
  public playClick() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }
}

export const soundManager = new SoundManager();
