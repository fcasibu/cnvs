import type { Camera, Point } from './types';
import { fail } from './utils';

export class CanvasCamera {
  private target: Point = { x: 0, y: 0 };
  private offset: Point = { x: 0, y: 0 };
  private rotation: number;
  private zoom: number;

  constructor(private readonly ctx: CanvasRenderingContext2D) {
    this.rotation = 0;
    this.zoom = 1.0;
  }

  public configure(camera: Partial<Camera>): void {
    for (const [key, value] of Object.entries(camera) as [
      keyof Camera,
      Camera[keyof Camera],
    ][]) {
      switch (key) {
        case 'target': {
          this.target = value as Point;
          break;
        }
        case 'offset': {
          this.offset = value as Point;
          break;
        }
        case 'rotation': {
          this.rotation = value as number;
          break;
        }
        case 'zoom': {
          const newZoomValue = value as number;

          fail(
            newZoomValue >= 0 && newZoomValue <= 1,
            'Zoom must be within the range of 0-1',
          );

          this.zoom = newZoomValue;
          break;
        }
        default: {
          const exhaustive: never = key;
          throw new Error(`Unknown key: ${exhaustive}`);
        }
      }
    }
  }

  public apply(): void {
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.rotate(this.rotation);
    this.ctx.translate(-this.target.x, -this.target.y);
  }

  public reset(): void {
    this.ctx.restore();
  }

  public worldToScreenCoordinates(world: Point): Point {
    const cosR = Math.cos(this.rotation);
    const sinR = Math.sin(this.rotation);

    const x = (world.x - this.target.x) * this.zoom;
    const y = (world.y - this.target.y) * this.zoom;

    return {
      x: x * cosR - y * sinR + this.offset.x,
      y: x * sinR + y * cosR + this.offset.y,
    };
  }

  public screenToWorldCoordinates(screen: Point): Point {
    const cosR = Math.cos(-this.rotation);
    const sinR = Math.sin(-this.rotation);

    const x = (screen.x - this.offset.x) / this.zoom;
    const y = (screen.y - this.offset.y) / this.zoom;

    return {
      x: x * cosR - y * sinR + this.target.x,
      y: x * sinR + y * cosR + this.target.y,
    };
  }
}
