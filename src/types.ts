export type Color = string;

export interface Camera {
  target: Point;
  offset: Point;
  rotation: number;
  zoom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: Color;
}

export interface Circle {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
  color: Color;
}

export type Shape = Rectangle | Circle;

export interface LineOptions {
  start: Point;
  end: Point;
  color: Color;
  lineWidth?: number;
}

export interface StrokeRectOptions {
  position: Point;
  width: number;
  height: number;
  color: Color;
  lineWidth?: number;
}

export interface TextOptions {
  text: string;
  position: Point;
  color: Color;
  fontSize: number;
  fontFamily?: string;
}

export interface ImageOptions {
  texture: ImageBitmap;
  position: Point;
}

export interface ImageRegionOptions {
  texture: ImageBitmap;
  source: Omit<Rectangle, 'color' | 'type'>;
  position: Point;
  flipDirection?: Point;
  rotationAngle?: number;
  scale?: number;
  color?: Color;
  blendMode?: GlobalCompositeOperation;
}

export interface MeasureTextOptions {
  text: string;
  fontSize: number;
  fontFamily?: string;
}
