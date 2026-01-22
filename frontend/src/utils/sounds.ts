// Sound effects using Web Audio API
// Wrestling-themed sounds for the quiz

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled ? 'true' : 'false');
  }

  isEnabled(): boolean {
    const stored = localStorage.getItem('soundEnabled');
    if (stored !== null) {
      this.enabled = stored === 'true';
    }
    return this.enabled;
  }

  // Bell ding for correct answer (wrestling bell sound)
  playCorrect() {
    if (!this.isEnabled()) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Create a bell-like sound (3 quick dings)
    for (let i = 0; i < 3; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800 + (i * 100);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, now + (i * 0.12));
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.12) + 0.15);

      oscillator.start(now + (i * 0.12));
      oscillator.stop(now + (i * 0.12) + 0.15);
    }
  }

  // Buzzer for wrong answer
  playWrong() {
    if (!this.isEnabled()) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 150;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  // Crowd cheer for level up / achievements
  playCrowdCheer() {
    if (!this.isEnabled()) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    // White noise burst to simulate crowd
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it sound more like a crowd
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.8);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.5);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 1.5);

    // Add some triumphant tones
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 chord
    frequencies.forEach((freq, _i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      oscGain.gain.setValueAtTime(0, now + 0.1);
      oscGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
      oscGain.gain.linearRampToValueAtTime(0, now + 1.2);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now + 0.1);
      osc.stop(now + 1.2);
    });
  }

  // Glass shatter for special achievements (Stone Cold reference!)
  playGlassShatter() {
    if (!this.isEnabled()) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Create glass shatter effect
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.15));
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.5, now);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.8);
  }

  // Tick sound for timer
  playTick() {
    if (!this.isEnabled()) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  // Urgent tick for low time
  playUrgentTick() {
    if (!this.isEnabled()) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 1500;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    oscillator.start(now);
    oscillator.stop(now + 0.08);
  }

  // XP gain sound
  playXpGain() {
    if (!this.isEnabled()) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Ascending notes
    const notes = [400, 500, 600, 800];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'sine';

      const startTime = now + (i * 0.08);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  }

  // Streak sound
  playStreak() {
    if (!this.isEnabled()) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Fire whoosh sound
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 5) * Math.sin(t * 50);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 1;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, now);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
  }
}

export const sounds = new SoundManager();
export default sounds;
