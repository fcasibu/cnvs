# cnvs

A library for working with HTML5 Canvas.

## Installation

```bash
npm install @fcasibu/cnvs
```

## Quick Start

```typescript
import {
  CanvasWindow,
  CanvasCamera,
  Renderer,
  InputManager,
} from '@fcasibu/cnvs';

// Set up the canvas
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024; 
// World size
// Can changed through HTML as well
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// If the world boundaries are large, it is best to do the following:
/**
 * <div style="overrflow: hidden; height: <smaller_size>; width: <smaller_size>;">
 *  <canvas width="5000" height="5000"></canvas>
 * </div>
 */
// This way we can just control the canvas through the Camera class

// Initialize core components
const canvasWindow = new CanvasWindow(canvas);
const renderer = new Renderer(canvasWindow.getContext());
const camera = new CanvasCamera(canvasWindow.getContext());
const input = new InputManager();

// Register input listeners
input.registerListeners(canvas);

// Game state
const playerPosition = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
const playerSpeed = 200;

// Set up camera
camera.configure({
  target: playerPosition,
  offset: { x: canvas.width / 2, y: canvas.height / 2 },
});

// Game loop
canvasWindow.run((timestep) => {
  // Handle input
  if (input.isKeyPressed('ArrowRight')) {
    playerPosition.x += playerSpeed * timestep;
  }
  if (input.isKeyPressed('ArrowLeft')) {
    playerPosition.x -= playerSpeed * timestep;
  }
  if (input.isKeyPressed('ArrowUp')) {
    playerPosition.y -= playerSpeed * timestep;
  }
  if (input.isKeyPressed('ArrowDown')) {
    playerPosition.y += playerSpeed * timestep;
  }

  // Update camera
  camera.configure({
    target: playerPosition,
  });

  // Clear screen
  renderer.clear('#333333');

  // Begin camera transformations
  camera.apply();

  // Draw game objects
  renderer.drawShape({
    type: 'rectangle',
    x: playerPosition.x - 25,
    y: playerPosition.y - 25,
    width: 50,
    height: 50,
    color: '#ff0000',
  });

  // End camera transformations
  camera.reset();

  // Draw UI (uses screen coordinates)
  renderer.drawText({
    text: 'Use arrow keys to move',
    position: { x: 10, y: 30 },
    fontSize: 16,
    color: '#ffffff',
  });
});
```

## Examples

### Drawing Shapes

```typescript
// Draw a rectangle
renderer.drawShape({
  type: 'rectangle',
  x: 100,
  y: 100,
  width: 50,
  height: 30,
  color: '#ff0000',
});

// Draw a circle
renderer.drawShape({
  type: 'circle',
  x: 200,
  y: 150,
  radius: 25,
  color: '#00ff00',
});

// Draw a stroked rectangle
renderer.strokeRect({
  position: { x: 300, y: 200 },
  width: 80,
  height: 40,
  color: '#0000ff',
  lineWidth: 2,
});

// Draw a line
renderer.drawLine({
  start: { x: 50, y: 50 },
  end: { x: 250, y: 200 },
  color: '#ffff00',
  lineWidth: 3,
});
```

### Using Textures

```typescript
// Define texture configuration
// Note: Assets must always be defined in the root
// If you are using a framework, in the `public` directory
const textureConfig = {
  player: {
    src: '/assets/player.png',
    lazy: false,
  },
  background: {
    src: '/assets/background.png',
    lazy: true,
  },
};

// Create texture manager and load textures
const textureManager = new TextureManager(textureConfig);
await textureManager.loadAll();

// Draw a texture
const playerTexture = await textureManager.get('player');
renderer.drawImage({
  texture: playerTexture,
  position: { x: 100, y: 100 },
});

// Draw a texture region (sprite from a sprite sheet)
renderer.drawImageRegion({
  texture: playerTexture,
  source: {
    x: 0,
    y: 0,
    width: 32,
    height: 32,
  },
  position: { x: 200, y: 200 },
  scale: 2,
  flipDirection: { x: -1, y: 1 }, // Flip horizontally
});
```

### Collision Detection

```typescript
// Define game objects
const player: Rectangle = {
  type: 'rectangle',
  x: 100,
  y: 100,
  width: 50,
  height: 50,
  color: '#ff0000',
};

const enemy: Rectangle = {
  type: 'circle',
  x: 200,
  y: 150,
  radius: 30,
  color: '#00ff00',
};

// Check for collisions between a circle and a rect
if (circleRectOverlap(enemy, player)) {
  console.log('Collision detected!');
}

// Check if a point is inside a rect
const mousePos = input.getMousePosition();
if (pointInRect(mousePos, player)) {
  console.log('Mouse is over the player!');
}

// Check if a point is inside a circle
if (pointInCircle(mousePos, enemy)) {
  console.log('Mouse is over the enemy!');
}
```

### Sound System

```typescript
// Define sound configuration
const soundConfig = {
  jump: {
    src: '/assets/jump.mp3',
    lazy: false,
  },
  background: {
    src: '/assets/music.mp3',
    lazy: true,
  },
};

// Create sound manager
const soundManager = new SoundManager(soundConfig);

// Play a sound
soundManager.play('jump');

// Play background music with loop
soundManager.play('background');
soundManager.setLoop('background', true);
soundManager.setVolume('background', 0.5);

// Set global volume
soundManager.setGlobalVolume(0.8);

// Stop all sounds when done
soundManager.unloadAll();
```

### Camera System

```typescript
// Create camera
const camera = new CanvasCamera(canvasWindow.getContext());

// Configure camera
camera.configure({
  target: playerPosition,
  zoom: 0.75,
  rotation: Math.PI / 12,
});

// Apply camera transformations for world rendering
camera.apply();

// Draw world objects here...
// All coordinates are now in world space

// Reset camera for UI rendering
camera.reset();

// Draw UI elements here...
// All coordinates are now in screen space
```

### Point Operations

```typescript
import {
  addPoints,
  subtractPoints,
  scalePoint,
  getDistance,
  getDistanceBetween,
  normalizePoint,
} from '@fcasibu/cnvs';

const position = { x: 100, y: 100 };
const velocity = { x: 5, y: 3 };

// Add points
const newPosition = addPoints(position, velocity);
// { x: 105, y: 103 }

// Subtract points
const direction = subtractPoints(targetPos, position);

// Scale point
const fastVelocity = scalePoint(velocity, 2);
// { x: 10, y: 6 }

// Get distance from origin
const speed = getDistance(velocity);

// Get distance between points
const distance = getDistanceBetween(position, targetPos);

// Normalize point
const normalizedDirection = normalizePoint(direction);
```

## Contributing

Contributions are welcome! Please submit pull requests and report issues on GitHub.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
