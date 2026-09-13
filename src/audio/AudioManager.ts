/**
 * AudioManager — architecture stub for Milestone 1.
 * Public API is already what gameplay will call (click/connect/success/...),
 * but playback is a silent no-op until real WebAudio/synth hooks land.
 * Audio must NEVER be a hard dependency: every method guards `enabled`.
 */

export type SoundName = 'click' | 'connect' | 'disconnect' | 'success' | 'error' | 'hum';

class AudioManager {
  private enabled = true;
  private unlocked = false;

  /** Call once from first user gesture; safe to call repeatedly. */
  unlock(): void {
    this.unlocked = true;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  play(_name: SoundName): void {
    // Milestone 6+ will route this to WebAudio oscillators.
    // Intentionally silent for the MVP shell.
    if (!this.enabled || !this.unlocked) return;
  }
}

export const audioManager = new AudioManager();
