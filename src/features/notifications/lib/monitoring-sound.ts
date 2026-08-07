'use client';

/**
 * Monitoring alert siren — synthesized with the Web Audio API so it works
 * without any asset file and is NOT gated behind cookie consent.
 *
 * - CRITICAL : rising/falling two-tone siren (like a command-center klaxon)
 * - HIGH     : sharp double ping
 * - MEDIUM   : single chime
 * - LOW      : soft click
 */

type AlertLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

let audioContext: AudioContext | null = null;
let sirenTimer: ReturnType<typeof setInterval> | null = null;
let lastPlayedAt = 0;
let unlockListenerAttached = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

// Browsers block AudioContext until the first user gesture. Attach a one-time
// unlock listener so the siren can actually play once the operator interacts.
function attachUnlockListener() {
  if (typeof window === 'undefined' || unlockListenerAttached) return;
  unlockListenerAttached = true;
  const unlock = () => {
    const ctx = getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}
attachUnlockListener();

function tone(
  ctx: AudioContext,
  opts: {
    start: number;
    duration: number;
    frequency: number;
    endFrequency?: number;
    type?: OscillatorType;
    gainValue?: number;
  },
) {
  const { start, duration, frequency, endFrequency, type = 'sine', gainValue = 0.09 } = opts;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + start);
  if (endFrequency !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), ctx.currentTime + start + duration);
  }

  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
}

function stopSiren() {
  if (sirenTimer) {
    clearInterval(sirenTimer);
    sirenTimer = null;
  }
}

export function playMonitoringAlert(level: AlertLevel) {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  if (now - lastPlayedAt < 600) return false; // debounce rapid duplicates
  lastPlayedAt = now;

  const ctx = getContext();
  if (!ctx) return false;

  stopSiren();

  switch (level) {
    case 'CRITICAL': {
      // Command-center klaxon: three sweeps, then a sustained pulse
      for (let i = 0; i < 3; i++) {
        const base = i * 0.34;
        tone(ctx, { start: base, duration: 0.3, frequency: 720, endFrequency: 920, type: 'triangle', gainValue: 0.14 });
        tone(ctx, { start: base + 0.3, duration: 0.3, frequency: 920, endFrequency: 720, type: 'triangle', gainValue: 0.14 });
      }
      tone(ctx, { start: 1.1, duration: 0.4, frequency: 480, endFrequency: 520, type: 'square', gainValue: 0.1 });
      break;
    }
    case 'HIGH': {
      tone(ctx, { start: 0, duration: 0.16, frequency: 880, type: 'sine', gainValue: 0.12 });
      tone(ctx, { start: 0.22, duration: 0.16, frequency: 880, type: 'sine', gainValue: 0.12 });
      break;
    }
    case 'MEDIUM': {
      tone(ctx, { start: 0, duration: 0.14, frequency: 660, type: 'sine', gainValue: 0.09 });
      break;
    }
    case 'LOW': {
      tone(ctx, { start: 0, duration: 0.08, frequency: 440, type: 'sine', gainValue: 0.05 });
      break;
    }
  }

  return true;
}

/**
 * Play the built-in notification ring bell sound using Web Audio synthesizer.
 */
export function playNotificationTone(): boolean {
  if (typeof window === 'undefined') return false;

  const ctx = getContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Dual bell tone: 880Hz + 1318Hz chime ring
    tone(ctx, { start: 0, duration: 0.4, frequency: 880, type: 'sine', gainValue: 0.16 });
    tone(ctx, { start: 0.08, duration: 0.5, frequency: 1318.5, type: 'sine', gainValue: 0.14 });
    return true;
  }

  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.7;
    void audio.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

