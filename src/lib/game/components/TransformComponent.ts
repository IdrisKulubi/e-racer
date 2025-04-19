import { Component } from '../core/Component';
import { ComponentTypes } from '../core/ComponentTypes';
import { Vector3, Quaternion, Euler, Matrix4 } from 'three';

/**
 * Transform component handles position, rotation and scale
 */
export class TransformComponent extends Component {
  type = ComponentTypes.TRANSFORM;
  
  position: Vector3;
  rotation: Euler;
  quaternion: Quaternion;
  scale: Vector3;
  matrix: Matrix4;
  matrixWorld: Matrix4;
  
  // Parent-child relationship
  parent: TransformComponent | null = null;
  children: TransformComponent[] = [];
  
  constructor() {
    super();
    this.position = new Vector3();
    this.rotation = new Euler();
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);
    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();
  }
  
  /**
   * Set position directly
   */
  setPosition(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    return this;
  }
  
  /**
   * Set rotation in Euler angles (degrees)
   */
  setRotation(x: number, y: number, z: number): this {
    this.rotation.set(
      x * Math.PI / 180,
      y * Math.PI / 180,
      z * Math.PI / 180
    );
    this.quaternion.setFromEuler(this.rotation);
    return this;
  }
  
  /**
   * Set rotation from quaternion
   */
  setQuaternion(x: number, y: number, z: number, w: number): this {
    this.quaternion.set(x, y, z, w);
    this.rotation.setFromQuaternion(this.quaternion);
    return this;
  }
  
  /**
   * Set scale
   */
  setScale(x: number, y: number, z: number): this {
    this.scale.set(x, y, z);
    return this;
  }
  
  /**
   * Add a child transform
   */
  add(child: TransformComponent): this {
    if (child.parent !== null) {
      child.parent.remove(child);
    }
    
    child.parent = this;
    this.children.push(child);
    
    return this;
  }
  
  /**
   * Remove a child transform
   */
  remove(child: TransformComponent): this {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
    }
    
    return this;
  }
  
  /**
   * Update local matrix
   */
  updateMatrix(): void {
    this.matrix.compose(this.position, this.quaternion, this.scale);
  }
  
  /**
   * Update world matrix (recursive)
   */
  updateWorldMatrix(updateParents: boolean = false, updateChildren: boolean = true): void {
    if (updateParents && this.parent) {
      this.parent.updateWorldMatrix(true, false);
    }
    
    this.updateMatrix();
    
    if (this.parent) {
      this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
    } else {
      this.matrixWorld.copy(this.matrix);
    }
    
    if (updateChildren) {
      for (const child of this.children) {
        child.updateWorldMatrix(false, true);
      }
    }
  }
  
  /**
   * Get forward direction vector
   */
  getForward(): Vector3 {
    const forward = new Vector3(0, 0, -1);
    return forward.applyQuaternion(this.quaternion).normalize();
  }
  
  /**
   * Get right direction vector
   */
  getRight(): Vector3 {
    const right = new Vector3(1, 0, 0);
    return right.applyQuaternion(this.quaternion).normalize();
  }
  
  /**
   * Get up direction vector
   */
  getUp(): Vector3 {
    const up = new Vector3(0, 1, 0);
    return up.applyQuaternion(this.quaternion).normalize();
  }
} 