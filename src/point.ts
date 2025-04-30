import type { Point } from './types';

export function addPoints(a: Point, b: Point): Point {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function subtractPoints(a: Point, b: Point): Point {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

export function scalePoint(point: Point, scalar: number): Point {
  return {
    x: point.x * scalar,
    y: point.y * scalar,
  };
}

export function getDistance(point: Point): number {
  return Math.sqrt(point.x * point.x + point.y * point.y);
}

export function getDistanceBetween(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalizePoint(point: Point): Point {
  const len = getDistance(point);

  return len > 0 ? { x: point.x / len, y: point.y / len } : { x: 0, y: 0 };
}
