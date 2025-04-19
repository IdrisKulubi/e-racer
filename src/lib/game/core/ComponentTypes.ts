/**
 * Component type constants
 * Using constants instead of enums for better type safety
 */
export const ComponentTypes = {
  // Transform and physics
  TRANSFORM: 'transform',
  RIGIDBODY: 'rigidbody',
  COLLIDER: 'collider',
  
  // Rendering
  MESH: 'mesh',
  CAMERA: 'camera',
  LIGHT: 'light',
  
  // Vehicle specific 
  VEHICLE: 'vehicle',
  WHEEL: 'wheel',
  ENGINE: 'engine',
  
  // Race related
  CHECKPOINT: 'checkpoint',
  LAP_COUNTER: 'lapCounter',
  RACE_POSITION: 'racePosition',
  
  // Networking
  NETWORK_IDENTITY: 'networkIdentity',
  NETWORK_TRANSFORM: 'networkTransform',
  
  // Input
  INPUT_CONTROLLER: 'inputController',
  
  // AI
  AI_CONTROLLER: 'aiController',
  
  // UI
  UI_ELEMENT: 'uiElement',
} as const;

export type ComponentType = typeof ComponentTypes[keyof typeof ComponentTypes]; 