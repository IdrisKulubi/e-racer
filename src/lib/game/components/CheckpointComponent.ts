import { Component } from '../core/Component';
import { ComponentTypes } from '../core/ComponentTypes';
import { Vector3 } from 'three';

/**
 * CheckpointComponent represents a checkpoint on the race track
 */
export class CheckpointComponent extends Component {
  type = ComponentTypes.CHECKPOINT;
  
  // Checkpoint properties
  index: number = 0; // Order in the race track
  isStartFinish: boolean = false; // Is this the start/finish line?
  radius: number = 20; // Increased from 10 for better detection
  
  // Checkpoint state
  private passedTimestamps: Map<string, number> = new Map(); // Player ID to timestamp
  
  constructor(index: number = 0, isStartFinish: boolean = false) {
    super();
    this.index = index;
    this.isStartFinish = isStartFinish;
  }
  
  /**
   * Check if a vehicle has passed through this checkpoint
   */
  checkVehiclePassing(vehicleEntityId: string, vehiclePosition: Vector3): boolean {
    // Simple distance-based detection
    // In a real implementation, we'd use proper collision detection
    const transform = this.entity?.getComponent(ComponentTypes.TRANSFORM);
    if (!transform) return false;
    
    const distance = transform.position.distanceTo(vehiclePosition);
    
    // Debug checkpoint detection - only log occasionally
    if (Math.random() < 0.01) {
      console.log(`Checkpoint ${this.index} check - Distance: ${distance.toFixed(2)}, Radius: ${this.radius}, Vehicle: ${vehicleEntityId}`);
    }
    
    if (distance <= this.radius) {
      // Vehicle is within checkpoint radius
      if (!this.passedTimestamps.has(vehicleEntityId)) {
        // First time passing, record timestamp
        this.passedTimestamps.set(vehicleEntityId, performance.now());
        console.log(`CHECKPOINT ${this.index} PASSED by ${vehicleEntityId}! ${this.isStartFinish ? '(START/FINISH LINE)' : ''}`);
        return true;
      }
    } else if (distance > this.radius * 1.5) {
      // Vehicle is far enough away to reset checkpoint
      // This allows passing through the same checkpoint again
      this.passedTimestamps.delete(vehicleEntityId);
    }
    
    return false;
  }
  
  /**
   * Get the timestamp when a specific vehicle passed this checkpoint
   */
  getPassingTimestamp(vehicleEntityId: string): number | null {
    return this.passedTimestamps.get(vehicleEntityId) || null;
  }
  
  /**
   * Reset checkpoint state for a specific vehicle
   */
  resetForVehicle(vehicleEntityId: string): void {
    this.passedTimestamps.delete(vehicleEntityId);
  }
  
  /**
   * Reset checkpoint state for all vehicles
   */
  resetAll(): void {
    this.passedTimestamps.clear();
  }
} 