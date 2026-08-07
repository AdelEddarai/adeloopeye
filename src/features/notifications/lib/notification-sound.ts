'use client';

/**
 * High-fidelity notification sound player using Web Audio API synthesizer
 * (guarantees sound plays without 404 asset dependence or CORS restrictions)
 * with automatic AudioContext resume and HTML5 Audio fallback.
 */

let sharedAudioContext: AudioContext | null = null;
let unlockAttached = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

function attachGlobalUnlock() {
  if (typeof window === 'undefined' || unlockAttached) return;
  unlockAttached = true;
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('pointerdown', unlock, { capture: true, once: true });
  window.addEventListener('keydown', unlock, { capture: true, once: true });
  window.addEventListener('click', unlock, { capture: true, once: true });
}

if (typeof window !== 'undefined') {
  attachGlobalUnlock();
}

/**
 * Synthesizes a crisp, clear dual-tone command-center notification bell ring (chime).
 * Frequency: 880 Hz (A5) + 1318.5 Hz (E6) with smooth exponential decay.
 */
export function playNotificationSound(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Primary chime oscillator (A5 - 880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Harmonating chime oscillator (E6 - 1318.5Hz - delayed 60ms for double-ring effect)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.06);
      gain2.gain.setValueAtTime(0.0001, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.14, now + 0.075);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.6);

      return true;
    }
  } catch (err) {
    console.warn('[NotificationSound] Web Audio synthesis error, falling back to mp3:', err);
  }

  // Fallback to HTML5 audio asset
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.7;
    void audio.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

