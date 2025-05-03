import { Howl, Howler } from 'howler';
import { fail } from './utils';

interface SoundConfigEntry {
  src: string;
  lazy: boolean;
}

export class SoundManager {
  private entries = new Map<string, Howl | (() => Howl)>();

  constructor(public readonly config: Record<string, SoundConfigEntry>) {
    for (const [name, { src, lazy }] of Object.entries(config)) {
      fail(src !== undefined, `Source must be provided for sound "${name}"`);
      fail(
        typeof src === 'string',
        `Source for sound "${name}" must be a string`,
      );

      this.entries.set(
        name,
        lazy ? () => new Howl({ src: [src] }) : new Howl({ src: [src] }),
      );
    }
  }

  public play(name: string): void {
    fail(name !== undefined, 'Sound name must be provided');
    fail(typeof name === 'string', 'Sound name must be a string');
    this.getAudio(name).play();
  }

  public pause(name: string): void {
    fail(name !== undefined, 'Sound name must be provided');
    fail(typeof name === 'string', 'Sound name must be a string');
    this.getAudio(name).pause();
  }

  public stop(name: string): void {
    fail(name !== undefined, 'Sound name must be provided');
    fail(typeof name === 'string', 'Sound name must be a string');
    this.getAudio(name).stop();
  }

  public setVolume(name: string, volume: number): void {
    fail(volume >= 0 && volume <= 1, 'Volume must be within the range of 0-1');
    this.getAudio(name).volume(volume);
  }

  public setLoop(name: string, loop: boolean): void {
    fail(name !== undefined, 'Sound name must be provided');
    fail(typeof name === 'string', 'Sound name must be a string');
    fail(loop !== undefined, 'Loop value must be provided');
    fail(typeof loop === 'boolean', 'Loop value must be a boolean');

    this.getAudio(name).loop(loop);
  }

  public setGlobalVolume(volume: number): void {
    fail(volume >= 0 && volume <= 1, 'Volume must be within the range of 0-1');
    Howler.volume(volume);
  }

  public unloadAll(): void {
    for (const [, value] of this.entries) {
      if (value instanceof Howl) {
        value.unload();
      }
    }

    this.entries.clear();
  }

  private getAudio(name: string): Howl {
    const entry = this.entries.get(name);
    fail(entry, `Failed to load audio with name: ${name}`);

    if (entry instanceof Howl) return entry;

    const resolved = entry();
    this.entries.set(name, resolved);
    return resolved;
  }
}
