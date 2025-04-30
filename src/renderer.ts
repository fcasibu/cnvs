import type {
  Circle,
  Color,
  Shape,
  Rectangle,
  LineOptions,
  StrokeRectOptions,
  TextOptions,
  ImageOptions,
  ImageRegionOptions,
  MeasureTextOptions,
} from './types';
import { fail } from './utils';

export class Renderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  public setGlobalAlpha(globalAlpha: number) {
    fail(
      globalAlpha >= 0 && globalAlpha <= 1,
      'Global alpha must be between 0 and 1',
    );
    this.ctx.globalAlpha = globalAlpha;
  }

  public clear(color: Color) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  public drawShape(shape: Shape) {
    const type = shape.type;
    switch (type) {
      case 'rectangle': {
        this.drawRectangle(shape);
        break;
      }
      case 'circle': {
        this.drawCircle(shape);
        break;
      }
      default: {
        const exhaustive: never = type;
        throw new Error(`Unknown shape type: ${exhaustive}`);
      }
    }
  }

  public drawLine(options: LineOptions): void {
    const { start, end, color, lineWidth = 1 } = options;

    fail(start !== undefined, 'Line start position must be provided');
    fail(end !== undefined, 'Line end position must be provided');
    fail(color !== undefined, 'Line color must be provided');
    fail(lineWidth > 0, 'Line width must be greater than 0');

    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  public strokeRect(options: StrokeRectOptions): void {
    const { position, width, height, color, lineWidth = 1 } = options;

    fail(position !== undefined, 'Rectangle position must be provided');
    fail(width !== undefined, 'Rectangle width must be provided');
    fail(height !== undefined, 'Rectangle height must be provided');
    fail(color !== undefined, 'Rectangle color must be provided');
    fail(width >= 0, 'Rectangle width must be non-negative');
    fail(height >= 0, 'Rectangle height must be non-negative');
    fail(lineWidth > 0, 'Line width must be greater than 0');

    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(position.x, position.y, width, height);
  }

  public drawImage(options: ImageOptions): void {
    const { texture, position } = options;

    fail(texture !== undefined, 'Image texture must be provided');
    fail(position !== undefined, 'Image position must be provided');
    fail(texture instanceof ImageBitmap, 'Texture must be an ImageBitmap');

    this.ctx.drawImage(texture, position.x, position.y);
  }

  public drawImageRegion(options: ImageRegionOptions): void {
    const {
      texture,
      source,
      position,
      flipDirection,
      scale = 1,
      color,
      blendMode = 'source-over',
    } = options;

    fail(texture !== undefined, 'Image texture must be provided');
    fail(source !== undefined, 'Source rectangle must be provided');
    fail(position !== undefined, 'Target position must be provided');
    fail(texture instanceof ImageBitmap, 'Texture must be an ImageBitmap');
    fail(source.width >= 0, 'Source width must be non-negative');
    fail(source.height >= 0, 'Source height must be non-negative');
    fail(scale > 0, 'Scale must be greater than 0');

    this.ctx.save();
    this.ctx.translate(position.x, position.y);

    if (flipDirection) {
      const flipX = flipDirection.x === -1;
      const flipY = flipDirection.y === -1;

      this.ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      this.ctx.translate(flipX ? -source.width : 0, flipY ? -source.height : 0);
    }

    if (color && blendMode !== 'source-over') {
      const buffer = document.createElement('canvas');
      buffer.width = source.width * scale;
      buffer.height = source.height * scale;
      const btx = buffer.getContext('2d');
      fail(btx, 'Failed to get canvas context');

      btx.drawImage(
        texture,
        source.x,
        source.y,
        source.width,
        source.height,
        0,
        0,
        source.width * scale,
        source.height * scale,
      );

      btx.fillStyle = color;
      btx.globalCompositeOperation = blendMode;
      btx.fillRect(0, 0, buffer.width, buffer.height);

      btx.globalCompositeOperation = 'destination-in';

      btx.drawImage(
        texture,
        source.x,
        source.y,
        source.width,
        source.height,
        0,
        0,
        source.width * scale,
        source.height * scale,
      );

      this.ctx.drawImage(buffer, 0, 0);
    } else {
      this.ctx.drawImage(
        texture,
        source.x,
        source.y,
        source.width,
        source.height,
        0,
        0,
        source.width * scale,
        source.height * scale,
      );
    }

    this.ctx.restore();
  }

  public drawText(options: TextOptions): void {
    const {
      text,
      position,
      color,
      fontSize,
      fontFamily = 'system-ui',
    } = options;

    fail(text !== undefined, 'Text content must be provided');
    fail(position !== undefined, 'Text position must be provided');
    fail(color !== undefined, 'Text color must be provided');
    fail(fontSize !== undefined, 'Font size must be provided');
    fail(fontSize > 0, 'Font size must be greater than 0');

    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;
    const { actualBoundingBoxAscent } = this.ctx.measureText(text);
    this.ctx.fillText(text, position.x, position.y + actualBoundingBoxAscent);
  }

  public measureText(options: MeasureTextOptions): TextMetrics {
    const { text, fontSize, fontFamily = 'system-ui' } = options;

    fail(text !== undefined, 'Text content must be provided');
    fail(fontSize !== undefined, 'Font size must be provided');
    fail(fontSize > 0, 'Font size must be greater than 0');

    const currentFont = this.ctx.font;
    this.ctx.font = `${fontSize}px ${fontFamily}`;

    const metrics = this.ctx.measureText(text);
    this.ctx.font = currentFont;

    return metrics;
  }

  private drawRectangle(rect: Rectangle) {
    const { x, y, width, height, color } = rect;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  private drawCircle(circle: Circle) {
    const { x, y, radius, color } = circle;

    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}
