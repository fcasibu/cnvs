import { fail } from './utils';

const DEFAULT_STATE = {
  isRunning: false,
  frameTime: 0,
  lastUpdate: 0,
  fps: 30,
  width: 0,
  height: 0,
  isPaused: false,
  isVisible: true,
};

const MAX_UPDATES = 5;

export class CanvasWindow {
  private state = { ...DEFAULT_STATE };

  private context: CanvasRenderingContext2D;
  private animationFrameId?: number;

  constructor(public readonly canvas: HTMLCanvasElement) {
    this.state.width = canvas.width;
    this.state.height = canvas.height;
    const ctx = canvas.getContext('2d');
    fail(ctx, 'Failed to get 2D rendering context');

    this.context = ctx;

    this.setupVisibilityHandling();
  }

  public getContext() {
    return this.context;
  }

  public getWindowWidth() {
    return this.state.width;
  }

  public getWindowHeight() {
    return this.state.height;
  }

  public setFps(fps: number) {
    fail(fps > 0, 'FPS must be greater than 0');
    this.state.fps = fps;
  }

  public run(callback: (timeStep: number) => void) {
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.lastUpdate = performance.now() / 1000;
    const targetFrameTime = 1 / this.state.fps;

    fail(targetFrameTime > 0, 'Target frame time must be positive');

    const loop = (timestampMs: number) => {
      if (!this.state.isRunning) return;

      if (!this.state.isVisible || this.state.isPaused) {
        this.state.lastUpdate = timestampMs / 1000;
        this.state.frameTime = 0;
        this.animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const timestamp = timestampMs / 1000;
      const dt = timestamp - this.state.lastUpdate;

      this.state.frameTime += dt;
      this.state.lastUpdate = timestamp;

      let updates = 0;

      while (this.state.frameTime >= targetFrameTime && updates < MAX_UPDATES) {
        callback(targetFrameTime);
        this.state.frameTime -= targetFrameTime;
        updates += 1;
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public getFPS() {
    return this.state.fps;
  }

  public pause() {
    this.state.isPaused = true;
  }

  public resume() {
    this.state.isPaused = false;
    this.state.lastUpdate = performance.now() / 1000;
  }

  public isPaused() {
    return this.state.isPaused;
  }

  public stop() {
    this.state.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    const { width, height, fps } = this.state;
    this.state = {
      ...DEFAULT_STATE,
      width,
      height,
      fps,
    };
  }

  private setupVisibilityHandling(): void {
    document.addEventListener(
      'visibilitychange',
      this.visibilityChangeListener,
    );
  }

  private visibilityChangeListener = () => {
    this.state.isVisible = document.visibilityState === 'visible';
  };
}
