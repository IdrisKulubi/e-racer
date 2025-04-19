import { Entity } from './Entity';
import { System } from './System';

/**
 * World class manages all entities and systems in the game
 */
export class World {
  private entities: Map<string, Entity>;
  private systems: System[];
  private entitiesToAdd: Entity[];
  private entitiesToRemove: Set<string>;
  private lastFixedUpdateTime: number;
  private fixedTimeStep: number;
  private accumulator: number;

  constructor(fixedTimeStep: number = 1/60) {
    this.entities = new Map();
    this.systems = [];
    this.entitiesToAdd = [];
    this.entitiesToRemove = new Set();
    this.lastFixedUpdateTime = 0;
    this.fixedTimeStep = fixedTimeStep;
    this.accumulator = 0;
  }

  /**
   * Add an entity to the world
   */
  addEntity(entity: Entity): this {
    this.entitiesToAdd.push(entity);
    return this;
  }

  /**
   * Remove an entity from the world
   */
  removeEntity(entityId: string): this {
    this.entitiesToRemove.add(entityId);
    return this;
  }

  /**
   * Get an entity by ID
   */
  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Add a system to the world
   */
  addSystem(system: System): this {
    system.init(this);
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
    return this;
  }

  /**
   * Process entity queue (add/remove)
   */
  private processEntityQueue(): void {
    // Add new entities
    for (const entity of this.entitiesToAdd) {
      this.entities.set(entity.id, entity);
    }
    this.entitiesToAdd = [];

    // Remove marked entities
    for (const entityId of this.entitiesToRemove) {
      const entity = this.entities.get(entityId);
      if (entity) {
        // Notify components
        for (const component of entity.getAllComponents()) {
          component.onRemove();
        }
        this.entities.delete(entityId);
      }
    }
    this.entitiesToRemove.clear();
  }

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities with specific components
   */
  getEntitiesWithComponents(componentTypes: string[]): Entity[] {
    return this.getAllEntities().filter(entity => 
      componentTypes.every(type => entity.hasComponent(type))
    );
  }

  /**
   * Update the world
   */
  update(currentTime: number): void {
    if (this.lastFixedUpdateTime === 0) {
      console.log(`[World] Initial update frame. Time: ${currentTime}`);
      this.lastFixedUpdateTime = currentTime;
      return;
    }

    const deltaTime = (currentTime - this.lastFixedUpdateTime) / 1000;
    this.lastFixedUpdateTime = currentTime;
    console.log(`[World] Update. CurrentTime: ${currentTime}, DeltaTime: ${deltaTime}`);

    // Cap delta time to prevent spiral of death
    const cappedDeltaTime = Math.min(deltaTime, 0.25);
    if (cappedDeltaTime !== deltaTime) {
        console.warn(`[World] DeltaTime capped from ${deltaTime} to ${cappedDeltaTime}`);
    }

    // Process entity changes
    this.processEntityQueue();

    // Fixed timestep updates
    this.accumulator += cappedDeltaTime;
    
    while (this.accumulator >= this.fixedTimeStep) {
      // Run fixed updates
      for (const system of this.systems) {
        system.fixedUpdate(this.fixedTimeStep);
      }

      // Update physics components
      for (const entity of this.entities.values()) {
        for (const component of entity.getAllComponents()) {
          component.fixedUpdate(this.fixedTimeStep);
        }
      }

      this.accumulator -= this.fixedTimeStep;
    }

    // Variable timestep updates
    for (const system of this.systems) {
      system.update(cappedDeltaTime);
    }

    // Update components
    for (const entity of this.entities.values()) {
      for (const component of entity.getAllComponents()) {
        component.update(cappedDeltaTime);
      }
    }
  }
} 