import { fail } from './utils';
import type { Point, Rectangle, Circle } from './types';

export function rectsOverlap(a: Rectangle, b: Rectangle): boolean {
  fail(a.width >= 0 && a.height >= 0 && b.width >= 0 && b.height >= 0);

  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function pointInRect(p: Point, r: Rectangle): boolean {
  fail(r.width >= 0 && r.height >= 0);

  return (
    p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
  );
}

export function circlesOverlap(a: Circle, b: Circle): boolean {
  fail(a.radius >= 0 && b.radius >= 0);

  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distSq = dx * dx + dy * dy;
  const radii = a.radius + b.radius;

  return distSq <= radii * radii;
}

export function pointInCircle(p: Point, c: Circle): boolean {
  fail(c.radius >= 0);

  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const distSq = dx * dx + dy * dy;

  return distSq <= c.radius * c.radius;
}

export function circleRectOverlap(circle: Circle, rect: Rectangle): boolean {
  fail(circle.radius >= 0 && rect.width >= 0 && rect.height >= 0);

  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distSq = dx * dx + dy * dy;

  return distSq <= circle.radius * circle.radius;
}
