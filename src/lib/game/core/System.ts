import { World } from './World';

/**
 * Base System class for the Entity-Component System
 * Systems process groups of entities that have specific components
 */
export abstract class System {
  protected world: World | null = null;
  priority: number = 0;
  
  /**
   * Initialize system with world
   */
  init(world: World): void {
    this.world = world;
  }
  
  /**
   * Update method called each frame
   */
  update(deltaTime: number): void {
    // Override in derived classes
  }
  
  /**
   * Fixed update method called at a fixed time interval
   */
  fixedUpdate(fixedDeltaTime: number): void {
    // Override in derived classes
  }
} 