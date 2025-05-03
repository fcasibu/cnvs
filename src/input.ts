import type { Point } from './types';
import { fail } from './utils';

interface MouseState {
  position: { x: number; y: number };
  pressedButtons: Set<number>;
}

interface KeyboardState {
  pressedKeys: Set<string>;
}

export class InputManager {
  private mouseState: MouseState = {
    position: {
      x: 0,
      y: 0,
    },
    pressedButtons: new Set<number>(),
  };
  private keyboardState: KeyboardState = {
    pressedKeys: new Set(),
  };
  private abortController = new AbortController();

  public getMousePosition(): Point {
    return Object.freeze(this.mouseState.position);
  }

  public isKeyPressed(key: string): boolean {
    fail(key !== undefined, 'Key must be provided');
    fail(typeof key === 'string', 'Key must be a string');
    return this.keyboardState.pressedKeys.has(key);
  }

  public areKeysPressed(keys: string[]): boolean {
    fail(keys !== undefined, 'Keys array must be provided');
    fail(Array.isArray(keys), 'Keys must be an array');
    fail(keys.length > 0, 'At least one key must be provided');

    keys.forEach((key, index) => {
      fail(typeof key === 'string', `Key at index ${index} must be a string`);
    });

    return keys.every((key) => this.keyboardState.pressedKeys.has(key));
  }

  public isMouseButtonPressed(button: number): boolean {
    fail(button !== undefined, 'Mouse button must be provided');
    fail(typeof button === 'number', 'Button must be a number');
    fail(button >= 0, 'Button must be non-negative');

    return this.mouseState.pressedButtons.has(button);
  }

  public unregisterListeners(): void {
    this.abortController.abort();
  }

  public registerListeners(canvas: HTMLCanvasElement): void {
    fail(canvas !== undefined, 'Canvas element must be provided');
    fail(
      canvas instanceof HTMLCanvasElement,
      'Provided element must be a canvas element',
    );

    canvas.addEventListener('mouseup', this.mouseUp, {
      signal: this.abortController.signal,
    });
    canvas.addEventListener('mousedown', this.mouseDown, {
      signal: this.abortController.signal,
    });
    canvas.addEventListener('mousemove', this.mouseMove, {
      signal: this.abortController.signal,
    });

    window.addEventListener('keyup', this.keyUp, {
      signal: this.abortController.signal,
    });

    window.addEventListener('keydown', this.keyDown, {
      signal: this.abortController.signal,
    });
  }

  private mouseUp = (event: MouseEvent): void => {
    this.mouseState.pressedButtons.delete(event.button);
  };

  private mouseDown = (event: MouseEvent): void => {
    event.preventDefault();

    this.mouseState.pressedButtons.add(event.button);
  };

  private mouseMove = (event: MouseEvent): void => {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();

    this.mouseState.position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  private keyUp = (event: KeyboardEvent): void => {
    this.keyboardState.pressedKeys.delete(event.key);
  };

  private keyDown = (event: KeyboardEvent) => {
    this.keyboardState.pressedKeys.add(event.key);
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(
        event.key,
      )
    ) {
      event.preventDefault();
    }
  };
}
