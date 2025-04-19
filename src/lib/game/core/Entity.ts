import { v4 as uuidv4 } from 'uuid';
import { Component } from './Component';

/**
 * Entity class for the Entity-Component System
 * Entities are containers for components and have a unique ID
 */
export class Entity {
  id: string;
  private components: Map<string, Component>;
  private tags: Set<string>;

  constructor() {
    this.id = uuidv4();
    this.components = new Map();
    this.tags = new Set();
  }

  /**
   * Add a component to this entity
   */
  addComponent(component: Component): this {
    this.components.set(component.type, component);
    component.entity = this;
    return this;
  }

  /**
   * Remove a component from this entity
   */
  removeComponent(componentType: string): this {
    if (this.components.has(componentType)) {
      const component = this.components.get(componentType);
      if (component) {
        component.entity = null;
      }
      this.components.delete(componentType);
    }
    return this;
  }

  /**
   * Get a component by type
   */
  getComponent<T extends Component>(componentType: string): T | null {
    return (this.components.get(componentType) as T) || null;
  }

  /**
   * Check if entity has a component
   */
  hasComponent(componentType: string): boolean {
    return this.components.has(componentType);
  }

  /**
   * Add a tag to this entity
   */
  addTag(tag: string): this {
    this.tags.add(tag);
    return this;
  }

  /**
   * Remove a tag from this entity
   */
  removeTag(tag: string): this {
    this.tags.delete(tag);
    return this;
  }

  /**
   * Check if entity has a tag
   */
  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  /**
   * Get all components
   */
  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }
} 