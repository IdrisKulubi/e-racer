import { Component } from '../core/Component';
import { ComponentTypes } from '../core/ComponentTypes';
import { Vector3, Quaternion } from 'three';
import { TransformComponent } from './TransformComponent';

/**
 * VehicleComponent handles car physics and movement
 */
export class VehicleComponent extends Component {
  type = ComponentTypes.VEHICLE;
  
  // Vehicle properties
  mass: number = 1500; // kg
  maxEngineForce: number = 2000; // N
  maxBrakingForce: number = 100; // N
  maxSteeringAngle: number = 30; // degrees
  
  // Current state
  velocity: Vector3 = new Vector3();
  acceleration: Vector3 = new Vector3();
  steeringAngle: number = 0;
  engineForce: number = 0;
  brakingForce: number = 0;
  
  // Wheel configuration
  wheelBase: number = 2.5; // distance between front and rear wheels
  trackWidth: number = 1.8; // distance between left and right wheels
  
  // Dynamics
  drag: number = 1.5;
  rollingResistance: number = 0.8;
  
  // Input state
  throttleInput: number = 0; // -1 to 1 (negative for reverse)
  brakeInput: number = 0; // 0 to 1
  steeringInput: number = 0; // -1 to 1
  
  constructor() {
    super();
  }
  
  /**
   * Set input values
   */
  setInputs(throttle: number, brake: number, steering: number): void {
    // Allow throttle to be negative for reverse
    this.throttleInput = Math.max(-1, Math.min(1, throttle));
    this.brakeInput = Math.max(0, Math.min(1, brake));
    this.steeringInput = Math.max(-1, Math.min(1, steering));
    
    // Debug log
    // console.log(`Inputs - Throttle: ${this.throttleInput}, Brake: ${this.brakeInput}, Steering: ${this.steeringInput}`);
  }
  
  /**
   * Apply engine force based on throttle input
   */
  private applyEngineForce(): void {
    // Apply engine force (can be negative for reverse)
    this.engineForce = this.maxEngineForce * this.throttleInput;
    
    // Debug log when reversing is applied
    if (this.throttleInput < 0) {
      console.log("Reversing with force:", this.engineForce);
    }
  }
  
  /**
   * Apply braking force based on brake input
   */
  private applyBrakingForce(): void {
    this.brakingForce = this.maxBrakingForce * this.brakeInput;
  }
  
  /**
   * Update steering angle based on steering input
   */
  private updateSteering(): void {
    // Reduce steering at high speeds for better stability
    const transform = this.entity?.getComponent<TransformComponent>(ComponentTypes.TRANSFORM);
    if (!transform) return;
    
    const speed = this.velocity.length();
    const speedFactor = Math.max(0, Math.min(1, 1 - (speed / 50)));
    const maxAngle = this.maxSteeringAngle * (0.5 + 0.5 * speedFactor);
    
    this.steeringAngle = this.steeringInput * maxAngle;
  }
  
  /**
   * Apply aerodynamic drag force
   */
  private applyDrag(deltaTime: number): void {
    const speed = this.velocity.length();
    if (speed > 0) {
      const dragForceMagnitude = this.drag * speed * speed;
      const dragForce = this.velocity.clone().normalize().multiplyScalar(-dragForceMagnitude);
      
      // F = ma, so a = F/m
      const dragAcceleration = dragForce.divideScalar(this.mass);
      this.acceleration.add(dragAcceleration);
    }
  }
  
  /**
   * Apply rolling resistance
   */
  private applyRollingResistance(deltaTime: number): void {
    const speed = this.velocity.length();
    if (speed > 0) {
      const resistanceForceMagnitude = this.rollingResistance * speed;
      const resistanceForce = this.velocity.clone().normalize().multiplyScalar(-resistanceForceMagnitude);
      
      // F = ma, so a = F/m
      const resistanceAcceleration = resistanceForce.divideScalar(this.mass);
      this.acceleration.add(resistanceAcceleration);
    }
  }
  
  /**
   * Fixed update for physics
   */
  override fixedUpdate(fixedDeltaTime: number): void {
    const transform = this.entity?.getComponent<TransformComponent>(ComponentTypes.TRANSFORM);
    if (!transform) return;
    
    // Calculate forces
    this.acceleration.set(0, 0, 0);
    
    // Update controls
    this.applyEngineForce();
    this.applyBrakingForce();
    this.updateSteering();
    
    // Apply engine force in the forward direction
    const forwardDir = transform.getForward();
    const engineAcceleration = forwardDir.clone().multiplyScalar(this.engineForce / this.mass);
    this.acceleration.add(engineAcceleration);
    
    // Apply braking force in the opposite of velocity direction
    if (this.brakingForce > 0 && this.velocity.lengthSq() > 0.1) {
      const brakeDir = this.velocity.clone().normalize().negate();
      const brakeAcceleration = brakeDir.multiplyScalar(this.brakingForce / this.mass);
      this.acceleration.add(brakeAcceleration);
    }
    
    // Apply resistive forces
    this.applyDrag(fixedDeltaTime);
    this.applyRollingResistance(fixedDeltaTime);
    
    // Update velocity
    this.velocity.add(this.acceleration.clone().multiplyScalar(fixedDeltaTime));
    
    // Apply steering (simplified model)
    if (Math.abs(this.steeringAngle) > 0.1 && this.velocity.lengthSq() > 0.1) {
      const steeringRad = this.steeringAngle * Math.PI / 180;
      const turnRadius = this.wheelBase / Math.sin(Math.abs(steeringRad));
      const angularVelocity = this.velocity.length() / turnRadius * Math.sign(this.steeringAngle);
      
      // Rotate velocity vector
      const speed = this.velocity.length();
      const rotationAngle = angularVelocity * fixedDeltaTime;
      transform.quaternion.multiply(
        new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), rotationAngle)
      );
      transform.rotation.setFromQuaternion(transform.quaternion);
      
      // Update velocity direction after rotation
      this.velocity = transform.getForward().multiplyScalar(speed);
    }
    
    // Update position
    transform.position.add(this.velocity.clone().multiplyScalar(fixedDeltaTime));
    
    // Update transformation matrices
    transform.updateMatrix();
    transform.updateWorldMatrix();
  }
} 