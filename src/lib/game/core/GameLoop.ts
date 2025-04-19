import { World } from './World';

/**
 * GameLoop manages the main game loop and timing
 */
export class GameLoop {
  private world: World;
  private isRunning: boolean = false;
  private rafId: number | null = null;
  private lastTime: number = 0;
  
  constructor(world: World) {
    this.world = world;
  }
  
  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;
    console.log('[GameLoop] Starting loop...');
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.isRunning) return;
    console.log('[GameLoop] Stopping loop...');
    this.isRunning = false;
    if (this.rafId !== null) {
      console.log(`[GameLoop] Cancelling animation frame: ${this.rafId}`);
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  /**
   * Main loop function
   */
  private loop(time: number): void {
    this.rafId = requestAnimationFrame(this.loop.bind(this));
    console.log(`[GameLoop] Frame requested. ID: ${this.rafId}, Time: ${time}`);
    
    // Update world
    this.world.update(time);
  }
} 