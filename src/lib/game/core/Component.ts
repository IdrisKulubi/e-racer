import { Entity } from './Entity';

/**
 * Base Component class for the Entity-Component System
 * Components store data and behavior for entities
 */
export abstract class Component {
  entity: Entity | null = null;
  abstract type: string;

  /**
   * Initialize component with entity
   */
  init(entity: Entity): void {
    this.entity = entity;
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

  /**
   * Cleanup when component is removed
   */
  onRemove(): void {
    // Override in derived classes
  }
} 