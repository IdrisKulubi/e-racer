import { Component } from '../core/Component';
import { ComponentTypes } from '../core/ComponentTypes';

/**
 * NetworkIdentityComponent identifies entities across the network
 */
export class NetworkIdentityComponent extends Component {
  type = ComponentTypes.NETWORK_IDENTITY;
  
  // Network properties
  networkId: string;
  ownerId: string;
  isOwner: boolean = false;
  isLocalPlayer: boolean = false;
  
  // Sync settings
  syncPosition: boolean = true;
  syncRotation: boolean = true;
  syncScale: boolean = false;
  syncVelocity: boolean = true;
  syncInterval: number = 100; // ms
  
  // State tracking
  lastSyncTime: number = 0;
  isDirty: boolean = false;
  
  constructor(networkId: string, ownerId: string) {
    super();
    this.networkId = networkId;
    this.ownerId = ownerId;
  }
  
  /**
   * Set this network object as owned by the local player
   */
  setAsLocalPlayer(): this {
    this.isLocalPlayer = true;
    this.isOwner = true;
    return this;
  }
  
  /**
   * Configure which properties to sync
   */
  setSyncProperties(syncPosition: boolean, syncRotation: boolean, syncScale: boolean, syncVelocity: boolean): this {
    this.syncPosition = syncPosition;
    this.syncRotation = syncRotation;
    this.syncScale = syncScale;
    this.syncVelocity = syncVelocity;
    return this;
  }
  
  /**
   * Set sync interval in milliseconds
   */
  setSyncInterval(intervalMs: number): this {
    this.syncInterval = intervalMs;
    return this;
  }
  
  /**
   * Mark the entity as changed and needs syncing
   */
  markDirty(): void {
    this.isDirty = true;
  }
  
  /**
   * Check if entity needs syncing based on time and dirty flag
   */
  needsSync(currentTime: number): boolean {
    if (!this.isOwner) return false;
    
    if (this.isDirty && currentTime - this.lastSyncTime >= this.syncInterval) {
      this.isDirty = false;
      this.lastSyncTime = currentTime;
      return true;
    }
    
    return false;
  }
} 