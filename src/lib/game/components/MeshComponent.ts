import { Component } from '../core/Component';
import { ComponentTypes } from '../core/ComponentTypes';
import { Mesh, Object3D } from 'three';
import { TransformComponent } from './TransformComponent';

/**
 * MeshComponent handles 3D rendering of an entity
 */
export class MeshComponent extends Component {
  type = ComponentTypes.MESH;
  
  // The Three.js object to render
  object: Object3D | null = null;
  
  // Visibility flag
  visible: boolean = true;
  
  // LOD settings
  enableLOD: boolean = false;
  lodDistances: number[] = [0, 50, 100, 200];
  lodMeshes: (Object3D | null)[] = [null, null, null, null];
  
  constructor(object?: Object3D) {
    super();
    if (object) {
      this.object = object;
      
      // If LOD is enabled, set the highest detail model as first LOD
      if (this.enableLOD) {
        this.lodMeshes[0] = object;
      }
    }
  }
  
  /**
   * Set the mesh object
   */
  setObject(object: Object3D): this {
    this.object = object;
    return this;
  }
  
  /**
   * Set LOD mesh for specific distance threshold
   */
  setLODMesh(lodLevel: number, object: Object3D): this {
    if (lodLevel >= 0 && lodLevel < this.lodMeshes.length) {
      this.lodMeshes[lodLevel] = object;
    }
    return this;
  }
  
  /**
   * Set LOD distance thresholds
   */
  setLODDistances(distances: number[]): this {
    this.lodDistances = distances;
    // Ensure lodMeshes array matches the new size
    this.lodMeshes = this.lodMeshes.slice(0, distances.length);
    while (this.lodMeshes.length < distances.length) {
      this.lodMeshes.push(null);
    }
    return this;
  }
  
  /**
   * Enable/disable LOD
   */
  setLODEnabled(enabled: boolean): this {
    this.enableLOD = enabled;
    return this;
  }
  
  /**
   * Update the mesh based on transform component
   */
  override update(deltaTime: number): void {
    if (!this.object) return;
    
    const transform = this.entity?.getComponent<TransformComponent>(ComponentTypes.TRANSFORM);
    if (!transform) return;
    
    // Update visibility
    this.object.visible = this.visible;
    
    // Apply transform to mesh
    this.object.position.copy(transform.position);
    this.object.quaternion.copy(transform.quaternion);
    this.object.scale.copy(transform.scale);
    
    // LOD update would happen here in a real implementation
    // based on camera distance to this object
  }
  
  /**
   * Clean up when component is removed
   */
  override onRemove(): void {
    if (this.object && this.object.parent) {
      this.object.parent.remove(this.object);
    }
    
    // Clean up LOD meshes
    if (this.enableLOD) {
      for (const lodMesh of this.lodMeshes) {
        if (lodMesh && lodMesh.parent) {
          lodMesh.parent.remove(lodMesh);
        }
      }
    }
  }
} 