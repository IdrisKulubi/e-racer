import { Component } from '../core/Component';
import { ComponentTypes } from '../core/ComponentTypes';
import { VehicleComponent } from './VehicleComponent';

/**
 * InputController handles keyboard input and controls a vehicle
 */
export class InputControllerComponent extends Component {
  type = ComponentTypes.INPUT_CONTROLLER;
  
  // Input state
  private keyState: Record<string, boolean> = {};
  
  // Configuration
  private sensitivity: number = 1.0;
  
  constructor() {
    super();
    
    // Set up event listeners when in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
  }
  
  /**
   * Clean up event listeners on removal
   */
  override onRemove(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    }
  }
  
  /**
   * Handle key down events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    this.keyState[event.key.toLowerCase()] = true;
  };
  
  /**
   * Handle key up events
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keyState[event.key.toLowerCase()] = false;
  };
  
  /**
   * Check if a key is pressed
   */
  private isKeyPressed(key: string): boolean {
    return !!this.keyState[key.toLowerCase()];
  }
  
  /**
   * Get throttle input from keys
   */
  private getThrottleInput(): number {
    let throttle = 0;
    
    // Forward
    if (this.isKeyPressed('w') || this.isKeyPressed('arrowup')) {
      throttle += 1;
    }
    
    // Reverse - add negative throttle instead of brake
    if (this.isKeyPressed('s') || this.isKeyPressed('arrowdown')) {
      throttle -= 1;
    }
    
    return Math.min(1, Math.max(-1, throttle));
  }
  
  /**
   * Get brake input from keys
   */
  private getBrakeInput(): number {
    let brake = 0;
    
    // Brake with space or B key
    if (this.isKeyPressed(' ') || this.isKeyPressed('b')) {
      brake += 1;
    }
    
    return Math.min(1, Math.max(0, brake));
  }
  
  /**
   * Get steering input from keys
   */
  private getSteeringInput(): number {
    let steering = 0;
    
    if (this.isKeyPressed('a') || this.isKeyPressed('arrowleft')) {
      steering -= 1;
    }
    
    if (this.isKeyPressed('d') || this.isKeyPressed('arrowright')) {
      steering += 1;
    }
    
    return Math.min(1, Math.max(-1, steering * this.sensitivity));
  }
  
  /**
   * Update vehicle inputs based on keyboard state
   */
  override update(deltaTime: number): void {
    const vehicle = this.entity?.getComponent<VehicleComponent>(ComponentTypes.VEHICLE);
    if (!vehicle) return;
    
    // Get input values
    const throttle = this.getThrottleInput();
    const brake = this.getBrakeInput();
    const steering = this.getSteeringInput();
    
    // Apply to vehicle
    vehicle.setInputs(throttle, brake, steering);
  }
} 