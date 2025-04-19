import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { ComponentTypes } from '../core/ComponentTypes';
import { NetworkIdentityComponent } from '../components/NetworkIdentityComponent';
import { TransformComponent } from '../components/TransformComponent';
import { VehicleComponent } from '../components/VehicleComponent';

// Network message types
export enum NetworkMessageType {
  TRANSFORM_UPDATE,
  VEHICLE_UPDATE,
  PLAYER_JOIN,
  PLAYER_LEAVE,
  RACE_START,
  RACE_END,
  CHECKPOINT_PASSED,
  LAP_COMPLETED
}

// Transform data for synchronization
export interface TransformData {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale?: { x: number; y: number; z: number };
}

// Vehicle data for synchronization
export interface VehicleData {
  velocity: { x: number; y: number; z: number };
  steeringAngle: number;
  engineForce: number;
  brakingForce: number;
}

// Network message structure
export interface NetworkMessage {
  type: NetworkMessageType;
  senderId: string;
  entityId: string;
  timestamp: number;
  data: any;
}

/**
 * NetworkSystem handles synchronization of entities across the network
 */
export class NetworkSystem extends System {
  // Higher priority to run before other systems
  priority = -10;
  
  // Network connection
  private socket: any = null;
  private clientId: string = '';
  private isConnected: boolean = false;
  
  // Sync settings
  private syncInterval: number = 100; // ms
  private lastSyncTime: number = 0;
  
  // Entity tracking
  private networkEntities: Map<string, Entity> = new Map();
  
  // Callback handlers
  private onPlayerJoin: ((playerId: string) => void) | null = null;
  private onPlayerLeave: ((playerId: string) => void) | null = null;
  
  /**
   * Connect to the server
   */
  connect(serverUrl: string, clientId: string): Promise<void> {
    if (this.isConnected) return Promise.resolve();
    
    this.clientId = clientId;
    
    return new Promise((resolve, reject) => {
      try {
        // In a real implementation, this would use Socket.io or another library
        this.socket = { 
          emit: (event: string, data: any) => {
            console.log(`Emitting ${event}:`, data);
          },
          on: (event: string, callback: (data: any) => void) => {
            console.log(`Registered handler for ${event}`);
          },
          disconnect: () => {
            console.log('Socket disconnected');
          }
        };
        
        // Register message handlers
        this.registerMessageHandlers();
        
        this.isConnected = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (!this.isConnected || !this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
    this.isConnected = false;
  }
  
  /**
   * Register network message handlers
   */
  private registerMessageHandlers(): void {
    if (!this.socket) return;
    
    // Handle transform updates
    this.socket.on('transform', (message: NetworkMessage) => {
      this.handleTransformUpdate(message);
    });
    
    // Handle vehicle updates
    this.socket.on('vehicle', (message: NetworkMessage) => {
      this.handleVehicleUpdate(message);
    });
    
    // Handle player join
    this.socket.on('playerJoin', (message: NetworkMessage) => {
      this.handlePlayerJoin(message);
    });
    
    // Handle player leave
    this.socket.on('playerLeave', (message: NetworkMessage) => {
      this.handlePlayerLeave(message);
    });
  }
  
  /**
   * Register a network entity
   */
  registerNetworkEntity(entity: Entity): void {
    const networkIdentity = entity.getComponent<NetworkIdentityComponent>(ComponentTypes.NETWORK_IDENTITY);
    if (networkIdentity) {
      this.networkEntities.set(networkIdentity.networkId, entity);
    }
  }
  
  /**
   * Unregister a network entity
   */
  unregisterNetworkEntity(networkId: string): void {
    this.networkEntities.delete(networkId);
  }
  
  /**
   * Handle transform update messages
   */
  private handleTransformUpdate(message: NetworkMessage): void {
    // Skip updates from self
    if (message.senderId === this.clientId) return;
    
    const entity = this.networkEntities.get(message.entityId);
    if (!entity) return;
    
    const networkIdentity = entity.getComponent<NetworkIdentityComponent>(ComponentTypes.NETWORK_IDENTITY);
    const transform = entity.getComponent<TransformComponent>(ComponentTypes.TRANSFORM);
    
    // Only apply if we don't own this entity and we have a transform component
    if (networkIdentity && transform && !networkIdentity.isOwner) {
      const transformData = message.data as TransformData;
      
      // Apply position update
      transform.position.set(
        transformData.position.x,
        transformData.position.y,
        transformData.position.z
      );
      
      // Apply rotation update
      transform.quaternion.set(
        transformData.rotation.x,
        transformData.rotation.y,
        transformData.rotation.z,
        transformData.rotation.w
      );
      
      // Apply scale update if available
      if (transformData.scale) {
        transform.scale.set(
          transformData.scale.x,
          transformData.scale.y,
          transformData.scale.z
        );
      }
      
      // Update transformation matrices
      transform.updateMatrix();
      transform.updateWorldMatrix();
    }
  }
  
  /**
   * Handle vehicle update messages
   */
  private handleVehicleUpdate(message: NetworkMessage): void {
    // Skip updates from self
    if (message.senderId === this.clientId) return;
    
    const entity = this.networkEntities.get(message.entityId);
    if (!entity) return;
    
    const networkIdentity = entity.getComponent<NetworkIdentityComponent>(ComponentTypes.NETWORK_IDENTITY);
    const vehicle = entity.getComponent<VehicleComponent>(ComponentTypes.VEHICLE);
    
    // Only apply if we don't own this entity and we have a vehicle component
    if (networkIdentity && vehicle && !networkIdentity.isOwner) {
      const vehicleData = message.data as VehicleData;
      
      // Apply vehicle state
      vehicle.velocity.set(
        vehicleData.velocity.x,
        vehicleData.velocity.y,
        vehicleData.velocity.z
      );
      
      vehicle.steeringAngle = vehicleData.steeringAngle;
      vehicle.engineForce = vehicleData.engineForce;
      vehicle.brakingForce = vehicleData.brakingForce;
    }
  }
  
  /**
   * Handle player join messages
   */
  private handlePlayerJoin(message: NetworkMessage): void {
    if (this.onPlayerJoin) {
      this.onPlayerJoin(message.senderId);
    }
  }
  
  /**
   * Handle player leave messages
   */
  private handlePlayerLeave(message: NetworkMessage): void {
    if (this.onPlayerLeave) {
      this.onPlayerLeave(message.senderId);
    }
  }
  
  /**
   * Send a transform update for an entity
   */
  private sendTransformUpdate(entity: Entity, networkIdentity: NetworkIdentityComponent): void {
    if (!this.isConnected || !this.socket) return;
    
    const transform = entity.getComponent<TransformComponent>(ComponentTypes.TRANSFORM);
    if (!transform) return;
    
    // Create transform data
    const transformData: TransformData = {
      position: {
        x: transform.position.x,
        y: transform.position.y,
        z: transform.position.z
      },
      rotation: {
        x: transform.quaternion.x,
        y: transform.quaternion.y,
        z: transform.quaternion.z,
        w: transform.quaternion.w
      }
    };
    
    // Add scale if needed
    if (networkIdentity.syncScale) {
      transformData.scale = {
        x: transform.scale.x,
        y: transform.scale.y,
        z: transform.scale.z
      };
    }
    
    // Create network message
    const message: NetworkMessage = {
      type: NetworkMessageType.TRANSFORM_UPDATE,
      senderId: this.clientId,
      entityId: networkIdentity.networkId,
      timestamp: performance.now(),
      data: transformData
    };
    
    // Send to server
    this.socket.emit('transform', message);
  }
  
  /**
   * Send a vehicle update for an entity
   */
  private sendVehicleUpdate(entity: Entity, networkIdentity: NetworkIdentityComponent): void {
    if (!this.isConnected || !this.socket) return;
    
    const vehicle = entity.getComponent<VehicleComponent>(ComponentTypes.VEHICLE);
    if (!vehicle) return;
    
    // Create vehicle data
    const vehicleData: VehicleData = {
      velocity: {
        x: vehicle.velocity.x,
        y: vehicle.velocity.y,
        z: vehicle.velocity.z
      },
      steeringAngle: vehicle.steeringAngle,
      engineForce: vehicle.engineForce,
      brakingForce: vehicle.brakingForce
    };
    
    // Create network message
    const message: NetworkMessage = {
      type: NetworkMessageType.VEHICLE_UPDATE,
      senderId: this.clientId,
      entityId: networkIdentity.networkId,
      timestamp: performance.now(),
      data: vehicleData
    };
    
    // Send to server
    this.socket.emit('vehicle', message);
  }
  
  /**
   * System update
   */
  override update(deltaTime: number): void {
    if (!this.isConnected || !this.world) return;
    
    const currentTime = performance.now();
    
    // Check if it's time to sync
    if (currentTime - this.lastSyncTime < this.syncInterval) return;
    
    // Get all entities with network identity component
    const networkEntities = this.world.getEntitiesWithComponents([ComponentTypes.NETWORK_IDENTITY]);
    
    // For each network entity we own
    for (const entity of networkEntities) {
      const networkIdentity = entity.getComponent<NetworkIdentityComponent>(ComponentTypes.NETWORK_IDENTITY);
      
      if (networkIdentity && networkIdentity.isOwner && networkIdentity.needsSync(currentTime)) {
        // Send transform update if needed
        if (networkIdentity.syncPosition || networkIdentity.syncRotation || networkIdentity.syncScale) {
          this.sendTransformUpdate(entity, networkIdentity);
        }
        
        // Send vehicle update if needed
        if (networkIdentity.syncVelocity && entity.hasComponent(ComponentTypes.VEHICLE)) {
          this.sendVehicleUpdate(entity, networkIdentity);
        }
      }
    }
    
    this.lastSyncTime = currentTime;
  }
  
  /**
   * Set player join callback
   */
  setOnPlayerJoin(callback: (playerId: string) => void): void {
    this.onPlayerJoin = callback;
  }
  
  /**
   * Set player leave callback
   */
  setOnPlayerLeave(callback: (playerId: string) => void): void {
    this.onPlayerLeave = callback;
  }
} 