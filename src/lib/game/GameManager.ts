import { World } from './core/World';
import { Entity } from './core/Entity';
import { GameLoop } from './core/GameLoop';
import { TransformComponent } from './components/TransformComponent';
import { VehicleComponent } from './components/VehicleComponent';
import { MeshComponent } from './components/MeshComponent';
import { InputControllerComponent } from './components/InputControllerComponent';
import { NetworkIdentityComponent } from './components/NetworkIdentityComponent';
import { LapCounterComponent } from './components/LapCounterComponent';
import { CheckpointComponent } from './components/CheckpointComponent';
import { NetworkSystem } from './systems/NetworkSystem';
import { RaceSystem } from './systems/RaceSystem';
import { ComponentTypes } from './core/ComponentTypes';
import { 
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  BoxGeometry,
  MeshStandardMaterial,
  Mesh,
  CylinderGeometry,
  Object3D,
  Vector3,
  Color,
  PlaneGeometry,
  DoubleSide,
  Group,
  CanvasTexture,
  TorusGeometry
} from 'three';
import { v4 as uuidv4 } from 'uuid';

/**
 * Car customization options
 */
export interface CarOptions {
  color: string;
  type: 'sport' | 'muscle' | 'compact';
}

/**
 * Player information
 */
export interface PlayerInfo {
  id: string;
  name: string;
  car: CarOptions;
}

/**
 * Track information
 */
export interface TrackInfo {
  id: string;
  name: string;
  numLaps: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Game state
 */
export enum GameState {
  LOBBY,
  LOADING,
  COUNTDOWN,
  RACING,
  FINISHED
}

/**
 * Sound manager for game audio
 */
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private engineSound: HTMLAudioElement | null = null;
  private engineVolume: number = 0;
  private currentMusic: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  
  constructor() {
    // Try to preload sounds if in browser
    if (typeof window !== 'undefined') {
      this.preloadSounds();
    }
  }
  
  /**
   * Preload game sounds
   */
  private preloadSounds(): void {
    // Game sounds
    this.loadSound('engine', '/sounds/engine.mp3');
    this.loadSound('tire_screech', '/sounds/tire_screech.mp3');
    this.loadSound('countdown', '/sounds/countdown.mp3');
    this.loadSound('race_start', '/sounds/race_start.mp3');
    this.loadSound('checkpoint', '/sounds/checkpoint.mp3');
    this.loadSound('lap_complete', '/sounds/lap_complete.mp3');
    
    // Music tracks
    this.loadSound('music_track1', '/sounds/music_track1.mp3');
  }
  
  /**
   * Load a sound file
   */
  private loadSound(id: string, url: string): void {
    try {
      // Create placeholder paths if not found
      const audio = new Audio();
      audio.src = url;
      audio.load(); // Preload audio
      this.sounds.set(id, audio);
      
      // Log success or fallback
      console.log(`[SoundManager] ${audio.src} loaded.`);
    } catch (error) {
      console.error(`[SoundManager] Failed to load sound ${id}:`, error);
    }
  }
  
  /**
   * Play a sound
   */
  playSound(id: string, loop: boolean = false, volume: number = 1.0): void {
    if (this.isMuted) return;
    
    const sound = this.sounds.get(id);
    if (sound) {
      // Clone the audio to allow multiple instances
      const audioInstance = sound.cloneNode() as HTMLAudioElement;
      audioInstance.loop = loop;
      audioInstance.volume = volume;
      audioInstance.play().catch(error => {
        console.warn(`[SoundManager] Couldn't play ${id}:`, error);
      });
    }
  }
  
  /**
   * Start engine sound with dynamic pitch/volume based on speed
   */
  startEngineSound(): void {
    if (this.isMuted) return;
    
    const sound = this.sounds.get('engine');
    if (sound && !this.engineSound) {
      this.engineSound = sound.cloneNode() as HTMLAudioElement;
      this.engineSound.loop = true;
      this.engineSound.volume = 0.1; // Start quiet
      this.engineSound.play().catch(error => {
        console.warn('[SoundManager] Couldn\'t play engine sound:', error);
      });
    }
  }
  
  /**
   * Update engine sound based on car speed and throttle
   */
  updateEngineSound(speed: number, throttle: number): void {
    if (!this.engineSound || this.isMuted) return;
    
    // Calculate engine volume based on throttle
    this.engineVolume = 0.1 + Math.abs(throttle) * 0.4;
    this.engineSound.volume = this.engineVolume;
    
    // Calculate engine pitch based on speed (HTML Audio has limited pitch control)
    // In a full implementation, we would use Web Audio API's AudioBufferSourceNode for better control
  }
  
  /**
   * Play tire screech sound
   */
  playTireScreech(intensity: number): void {
    if (this.isMuted) return;
    
    const volume = Math.min(1.0, Math.max(0.1, intensity));
    this.playSound('tire_screech', false, volume);
  }
  
  /**
   * Play countdown sequence
   */
  playCountdown(): void {
    if (this.isMuted) return;
    
    this.playSound('countdown', false, 0.7);
  }
  
  /**
   * Play race start sound
   */
  playRaceStart(): void {
    if (this.isMuted) return;
    
    this.playSound('race_start', false, 0.8);
  }
  
  /**
   * Play checkpoint sound
   */
  playCheckpoint(): void {
    if (this.isMuted) return;
    
    this.playSound('checkpoint', false, 0.5);
  }
  
  /**
   * Play lap complete sound
   */
  playLapComplete(): void {
    if (this.isMuted) return;
    
    this.playSound('lap_complete', false, 0.6);
  }
  
  /**
   * Start playing background music
   */
  playMusic(id: string = 'music_track1', volume: number = 0.3): void {
    if (this.isMuted) return;
    
    // Stop any current music
    this.stopMusic();
    
    const music = this.sounds.get(id);
    if (music) {
      this.currentMusic = music.cloneNode() as HTMLAudioElement;
      this.currentMusic.loop = true;
      this.currentMusic.volume = volume;
      this.currentMusic.play().catch(error => {
        console.warn(`[SoundManager] Couldn't play music ${id}:`, error);
      });
    }
  }
  
  /**
   * Stop music playback
   */
  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic = null;
    }
  }
  
  /**
   * Toggle sound on/off
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      // Mute all active sounds
      if (this.engineSound) {
        this.engineSound.pause();
      }
      if (this.currentMusic) {
        this.currentMusic.pause();
      }
    } else {
      // Resume playback
      if (this.engineSound) {
        this.engineSound.play().catch(console.error);
      }
      if (this.currentMusic) {
        this.currentMusic.play().catch(console.error);
      }
    }
    
    return this.isMuted;
  }
  
  /**
   * Clean up all audio resources
   */
  dispose(): void {
    if (this.engineSound) {
      this.engineSound.pause();
      this.engineSound = null;
    }
    
    this.stopMusic();
    this.sounds.clear();
  }
}

/**
 * Multiplayer racing game manager
 */
export class GameManager {
  // Core engine components
  private world: World;
  private gameLoop: GameLoop;
  
  // Three.js rendering components
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer | null = null;
  
  // Game systems
  private networkSystem: NetworkSystem;
  private raceSystem: RaceSystem;
  private soundManager: SoundManager;
  
  // Player and track data
  private localPlayerId: string = '';
  private players: Map<string, PlayerInfo> = new Map();
  private playerEntities: Map<string, Entity> = new Map();
  private trackInfo: TrackInfo | null = null;
  
  // Game state
  private gameState: GameState = GameState.LOBBY;
  private isHost: boolean = false;
  
  // Callback for UI updates
  private onGameStateChanged: ((state: GameState) => void) | null = null;
  private onPlayerJoined: ((player: PlayerInfo) => void) | null = null;
  private onPlayerLeft: ((playerId: string) => void) | null = null;
  private onCountdownTick: ((secondsRemaining: number) => void) | null = null;
  private onPositionUpdated: ((position: number, totalPlayers: number) => void) | null = null;
  private onLapCompleted: ((lapNumber: number, lapTime: number, bestLap: boolean) => void) | null = null;
  
  constructor() {
    // Create world with 60Hz fixed timestep
    this.world = new World(1/60);
    this.gameLoop = new GameLoop(this.world);
    
    // Create systems
    this.networkSystem = new NetworkSystem();
    this.raceSystem = new RaceSystem();
    this.soundManager = new SoundManager();
    
    // Add systems to world
    this.world.addSystem(this.networkSystem);
    this.world.addSystem(this.raceSystem);
    
    // Set up Three.js scene
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    
    // Register system callbacks
    this.registerCallbacks();
  }
  
  /**
   * Set up UI callbacks
   */
  private registerCallbacks(): void {
    // Network callbacks
    this.networkSystem.setOnPlayerJoin((playerId) => {
      // Handle player join
      const player = this.players.get(playerId);
      if (player && this.onPlayerJoined) {
        this.onPlayerJoined(player);
      }
    });
    
    this.networkSystem.setOnPlayerLeave((playerId) => {
      // Handle player leave
      if (this.onPlayerLeft) {
        this.onPlayerLeft(playerId);
      }
      
      // Remove player entity
      const entity = this.playerEntities.get(playerId);
      if (entity && this.world) {
        this.world.removeEntity(entity.id);
      }
      
      this.players.delete(playerId);
      this.playerEntities.delete(playerId);
    });
    
    // Race callbacks
    this.raceSystem.setOnCountdownTick((secondsRemaining) => {
      // console.log(`[GameManager] Received onCountdownTick: ${secondsRemaining}`); // Optional: log tick receipt
      if (this.onCountdownTick) {
        this.onCountdownTick(secondsRemaining);
      }
      
      // Play countdown sound
      if (secondsRemaining <= 3) {
        this.soundManager.playCountdown();
      }
    });
    
    this.raceSystem.setOnRaceStart(() => {
      console.log('[GameManager] Received onRaceStart callback from RaceSystem.'); // Log callback receipt
      this.setGameState(GameState.RACING);
      
      // Play race start sound & engine
      this.soundManager.playRaceStart();
      this.soundManager.startEngineSound();
      
      // Start background music
      this.soundManager.playMusic();
    });
    
    this.raceSystem.setOnRaceEnd(() => {
      this.setGameState(GameState.FINISHED);
      
      // Stop engine sound but keep music
      if (this.soundManager) {
        // Keep low engine idle
        this.soundManager.updateEngineSound(0, 0.1);
      }
    });
    
    this.raceSystem.setOnCheckpointPassed((entityId, checkpointIndex) => {
      // Play checkpoint sound
      this.soundManager.playCheckpoint();
      
      // Log checkpoint passage for debugging
      console.log(`[GameManager] Player ${entityId} passed checkpoint ${checkpointIndex}`);
    });
    
    this.raceSystem.setOnLapCompleted((entityId, lapNumber, lapTime) => {
      // Check if this is the local player
      const entity = this.playerEntities.get(this.localPlayerId);
      if (entity && entityId === entity.id) {
        const lapCounter = entity.getComponent<LapCounterComponent>(ComponentTypes.LAP_COUNTER);
        if (lapCounter && this.onLapCompleted) {
          const isBestLap = lapCounter.bestLapTime === lapTime;
          this.onLapCompleted(lapNumber, lapTime, isBestLap);
          
          // Play lap complete sound
          this.soundManager.playLapComplete();
        }
      }
    });
  }
  
  /**
   * Initialize renderer with canvas element
   */
  initRenderer(canvas: HTMLCanvasElement): void {
    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.resetCamera();
    this.addLights();
  }
  
  /**
   * Resize renderer to fit container
   */
  resizeRenderer(width: number, height: number): void {
    if (!this.renderer) return;
    
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  
  /**
   * Reset camera to default position
   */
  private resetCamera(): void {
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 0, 0);
  }
  
  /**
   * Add lights to the scene
   */
  private addLights(): void {
    // Ambient light
    const ambient = new AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    
    // Directional light (sun)
    const sun = new DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    this.scene.add(sun);
  }
  
  /**
   * Connect to multiplayer server
   */
  async connectToServer(serverUrl: string, playerName: string, carOptions: CarOptions): Promise<void> {
    this.localPlayerId = uuidv4();
    
    // Create player info
    const playerInfo: PlayerInfo = {
      id: this.localPlayerId,
      name: playerName,
      car: carOptions
    };
    
    // Add to players
    this.players.set(this.localPlayerId, playerInfo);
    
    // Connect to server
    try {
      await this.networkSystem.connect(serverUrl, this.localPlayerId);
      this.setGameState(GameState.LOBBY);
    } catch (error) {
      console.error('Failed to connect to server:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from multiplayer server
   */
  disconnect(): void {
    this.networkSystem.disconnect();
    this.stopGame();
  }
  
  /**
   * Create a local car entity
   */
  private createLocalPlayer(): Entity {
    // Create car entity
    const car = new Entity();
    
    // Add transform component
    const transform = new TransformComponent();
    car.addComponent(transform);
    
    // Add vehicle physics component
    const vehicle = new VehicleComponent();
    car.addComponent(vehicle);
    
    // Add network identity
    const network = new NetworkIdentityComponent(this.localPlayerId, this.localPlayerId);
    network.setAsLocalPlayer();
    car.addComponent(network);
    
    // Add lap counter - set proper checkpoint count (5 for our square track)
    const laps = this.trackInfo?.numLaps || 3;
    const lapCounter = new LapCounterComponent(laps, 5); // Hardcoded to 5 checkpoints for now
    car.addComponent(lapCounter);
    
    // Add input controller
    const input = new InputControllerComponent();
    car.addComponent(input);
    
    // Add mesh component with placeholder car model
    const carMesh = this.createCarMesh(this.players.get(this.localPlayerId)?.car);
    const mesh = new MeshComponent(carMesh);
    car.addComponent(mesh);
    
    // Add to scene
    this.scene.add(carMesh);
    
    // Add to world
    this.world.addEntity(car);
    
    // Track entity
    this.playerEntities.set(this.localPlayerId, car);
    
    return car;
  }
  
  /**
   * Create a car for another player
   */
  private createRemotePlayer(playerId: string): Entity {
    const playerInfo = this.players.get(playerId);
    if (!playerInfo) throw new Error(`Player ${playerId} not found`);
    
    // Create car entity
    const car = new Entity();
    
    // Add transform component
    const transform = new TransformComponent();
    car.addComponent(transform);
    
    // Add vehicle physics component
    const vehicle = new VehicleComponent();
    car.addComponent(vehicle);
    
    // Add network identity
    const network = new NetworkIdentityComponent(playerId, playerId);
    car.addComponent(network);
    
    // Add lap counter
    const laps = this.trackInfo?.numLaps || 3;
    const lapCounter = new LapCounterComponent(laps, 0); // Will set checkpoint count later
    car.addComponent(lapCounter);
    
    // Add mesh component with placeholder car model
    const carMesh = this.createCarMesh(playerInfo.car);
    const mesh = new MeshComponent(carMesh);
    car.addComponent(mesh);
    
    // Add to scene
    this.scene.add(carMesh);
    
    // Add to world
    this.world.addEntity(car);
    
    // Register with network system
    this.networkSystem.registerNetworkEntity(car);
    
    // Track entity
    this.playerEntities.set(playerId, car);
    
    return car;
  }
  
  /**
   * Create a simple car mesh
   */
  private createCarMesh(options?: CarOptions): Object3D {
    const color = options?.color || '#ff0000';
    const type = options?.type || 'sport';
    
    // Create group to hold all parts
    const carGroup = new Object3D();
    
    // Create car body based on type
    let bodyGeometry: BoxGeometry;
    
    if (type === 'sport') {
      bodyGeometry = new BoxGeometry(2, 0.5, 4);
    } else if (type === 'muscle') {
      bodyGeometry = new BoxGeometry(2.2, 0.6, 4.2);
    } else {
      bodyGeometry = new BoxGeometry(1.8, 0.7, 3.5);
    }
    
    const bodyMaterial = new MeshStandardMaterial({ color: new Color(color) });
    const body = new Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    carGroup.add(body);
    
    // Add wheels
    const wheelGeometry = new CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new MeshStandardMaterial({ color: 0x333333 });
    
    // Position wheels at corners
    const wheelPositions = [
      new Vector3(-1, 0.4, -1.5), // Front left
      new Vector3(1, 0.4, -1.5),  // Front right
      new Vector3(-1, 0.4, 1.5),  // Rear left
      new Vector3(1, 0.4, 1.5)    // Rear right
    ];
    
    for (const position of wheelPositions) {
      const wheel = new Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.copy(position);
      carGroup.add(wheel);
    }
    
    return carGroup;
  }
  
  /**
   * Create a basic track with checkpoints and decorations
   */
  private createTrack(): void {
    if (!this.trackInfo) return;
    
    // Clear existing track
    // (In a real implementation, we would load a track model based on trackInfo.id)
    
    // Create a simple ground plane
    const groundGeometry = new BoxGeometry(100, 1, 100);
    const groundMaterial = new MeshStandardMaterial({ color: 0x7CFC00 });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    this.scene.add(ground);
    
    // Create track materials
    const trackMaterial = new MeshStandardMaterial({ color: 0x666666 });
    const barrierMaterial = new MeshStandardMaterial({ color: 0xdd2222 });
    const centerMaterial = new MeshStandardMaterial({ color: 0x228822 }); // Darker green for infield
    
    // Create a square track
    const trackSegments = [
      { x: 0, z: -30 },   // Start/finish
      { x: 30, z: -30 },  // Turn 1
      { x: 30, z: 30 },   // Turn 2
      { x: -30, z: 30 },  // Turn 3
      { x: -30, z: -30 }, // Turn 4 back to start
    ];
    
    // Create infield (central area)
    this.createInfield(trackSegments, centerMaterial);
    
    // Create track barriers and billboards with racing phrases
    const phrases = [
      "NO LIMITS", 
      "IDRIS WORLD", 
      "FULL THROTTLE", 
      "RACE TO WIN", 
      "SPEED ZONE"
    ];
    
    // Add track segments
    for (let i = 0; i < trackSegments.length; i++) {
      const segment = trackSegments[i];
      const nextSegment = trackSegments[(i + 1) % trackSegments.length];
      
      // Calculate center of track segment
      const centerX = (segment.x + nextSegment.x) / 2;
      const centerZ = (segment.z + nextSegment.z) / 2;
      
      // Calculate length and orientation
      const deltaX = nextSegment.x - segment.x;
      const deltaZ = nextSegment.z - segment.z;
      const length = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
      const angle = Math.atan2(deltaZ, deltaX);
      
      // Create segment mesh
      const segmentGeometry = new BoxGeometry(length, 0.1, 10);
      const segmentMesh = new Mesh(segmentGeometry, trackMaterial);
      segmentMesh.position.set(centerX, 0, centerZ);
      segmentMesh.rotation.y = angle;
      this.scene.add(segmentMesh);
      
      // Add barriers on both sides of track
      this.createTrackBarrier(centerX, centerZ, length, 10, angle, barrierMaterial);
      
      // Add decorative billboard beside the track
      const billboardPhrase = phrases[i % phrases.length];
      this.createBillboard(
        segment.x + (deltaX * 0.3) + (deltaZ * 0.15), 
        segment.z + (deltaZ * 0.3) - (deltaX * 0.15), 
        billboardPhrase,
        angle + Math.PI / 2 // Rotate to face track
      );
      
      // Create checkpoint at the end of each segment
      this.createCheckpoint(i, nextSegment.x, nextSegment.z, i === 0);
    }
    
    // Add audience stands
    this.createAudienceStands(-20, -40, 40, 5, 0);
    this.createAudienceStands(40, -20, 5, 40, Math.PI / 2);
  }
  
  /**
   * Create infield with decorative elements
   */
  private createInfield(trackSegments: {x: number, z: number}[], centerMaterial: MeshStandardMaterial): void {
    // Create center infield area
    const infield = new Group();
    
    // Create infield ground (darker grass)
    const infieldGeometry = new BoxGeometry(60, 0.05, 60);
    const infieldMesh = new Mesh(infieldGeometry, centerMaterial);
    infieldMesh.position.set(0, 0.06, 0); // Slightly above the main ground
    infield.add(infieldMesh);
    
    // Add central sculpture/monument
    this.createCentralMonument();
    
    // Add decorative trees/elements in a pattern
    for (let i = -25; i <= 25; i += 8) {
      for (let j = -25; j <= 25; j += 8) {
        // Skip the very center where the monument is
        if (Math.abs(i) < 7 && Math.abs(j) < 7) continue;
        
        // Create a variety of decorative elements
        const random = Math.random();
        if (random > 0.7) {
          this.createDecorativeElement(i, j, 'tree');
        } else if (random > 0.4) {
          this.createDecorativeElement(i, j, 'bush');
        } else if (random > 0.2) {
          this.createGrandstand(i, j, Math.random() * Math.PI * 2);
        } else {
          this.createSmallBarrel(i, j);
        }
      }
    }
    
    // Add sponsor logos on the infield
    this.createSponsorLogo(-15, 0, "TURBO OIL", 0);
    this.createSponsorLogo(15, 0, "SPEED TIRES", Math.PI);
    this.createSponsorLogo(0, -15, "NITRO BOOST", Math.PI / 2);
    this.createSponsorLogo(0, 15, "RACING LEAGUE", -Math.PI / 2);
    
    // Add pit stop area
    this.createPitStop(-25, 25);
    
    // Add to scene
    this.scene.add(infield);
  }
  
  /**
   * Create central monument
   */
  private createCentralMonument(): void {
    const monumentGroup = new Group();
    
    // Base
    const baseGeometry = new BoxGeometry(10, 1, 10);
    const baseMaterial = new MeshStandardMaterial({ color: 0x999999 });
    const base = new Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.5, 0);
    monumentGroup.add(base);
    
    // Center pillar
    const pillarGeometry = new BoxGeometry(2, 8, 2);
    const pillarMaterial = new MeshStandardMaterial({ color: 0xcccccc });
    const pillar = new Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(0, 5, 0);
    monumentGroup.add(pillar);
    
    // Trophy top
    const trophyGeometry = new CylinderGeometry(0, 2, 4, 8);
    const trophyMaterial = new MeshStandardMaterial({ color: 0xffd700 });
    const trophy = new Mesh(trophyGeometry, trophyMaterial);
    trophy.position.set(0, 10, 0);
    monumentGroup.add(trophy);
    
    // Position and add to scene
    monumentGroup.position.set(0, 0.1, 0);
    this.scene.add(monumentGroup);
  }
  
  /**
   * Create a decorative element (tree or bush)
   */
  private createDecorativeElement(x: number, z: number, type: 'tree' | 'bush'): void {
    const elementGroup = new Group();
    
    // Common base/trunk
    const trunkGeometry = new CylinderGeometry(0.3, 0.5, 1, 8);
    const trunkMaterial = new MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(0, 0.5, 0);
    elementGroup.add(trunk);
    
    if (type === 'tree') {
      // Tree top
      const treeTopGeometry = new CylinderGeometry(0, 2, 4, 8);
      const treeTopMaterial = new MeshStandardMaterial({ color: 0x005500 });
      const treeTop = new Mesh(treeTopGeometry, treeTopMaterial);
      treeTop.position.set(0, 3, 0);
      elementGroup.add(treeTop);
    } else {
      // Bush
      const bushGeometry = new BoxGeometry(2, 1.5, 2);
      const bushMaterial = new MeshStandardMaterial({ color: 0x228800 });
      const bush = new Mesh(bushGeometry, bushMaterial);
      bush.position.set(0, 1.25, 0);
      elementGroup.add(bush);
    }
    
    // Add some randomness to position and rotation
    const offsetX = (Math.random() - 0.5) * 2;
    const offsetZ = (Math.random() - 0.5) * 2;
    const rotation = Math.random() * Math.PI * 2;
    
    // Position and add to scene
    elementGroup.position.set(x + offsetX, 0.1, z + offsetZ);
    elementGroup.rotation.y = rotation;
    this.scene.add(elementGroup);
  }
  
  /**
   * Create sponsor logo on the ground
   */
  private createSponsorLogo(x: number, z: number, text: string, rotation: number): void {
    // Create a canvas for the logo texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Fill background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    context.strokeStyle = '#000000';
    context.lineWidth = 10;
    context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    // Draw text
    context.fillStyle = '#000000';
    context.font = 'bold 72px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new CanvasTexture(canvas);
    
    // Create logo mesh on the ground
    const logoGeometry = new PlaneGeometry(10, 5);
    const logoMaterial = new MeshStandardMaterial({
      map: texture,
      side: DoubleSide,
      transparent: true
    });
    
    const logo = new Mesh(logoGeometry, logoMaterial);
    logo.rotation.x = -Math.PI / 2; // Flat on the ground
    logo.rotation.z = rotation;
    logo.position.set(x, 0.11, z); // Slightly above ground
    
    this.scene.add(logo);
  }
  
  /**
   * Create audience stands
   */
  private createAudienceStands(x: number, z: number, width: number, depth: number, rotation: number): void {
    const standsGroup = new Group();
    
    // Base
    const baseGeometry = new BoxGeometry(width, 1, depth);
    const baseMaterial = new MeshStandardMaterial({ color: 0x999999 });
    const base = new Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.5, 0);
    standsGroup.add(base);
    
    // Create terraced stands (3 levels)
    const standColors = [0xcccccc, 0xdddddd, 0xeeeeee];
    
    for (let i = 0; i < 3; i++) {
      const standGeometry = new BoxGeometry(width, 1, depth * 0.8 * (1 - i * 0.2));
      const standMaterial = new MeshStandardMaterial({ color: standColors[i] });
      const stand = new Mesh(standGeometry, standMaterial);
      stand.position.set(0, 1.5 + i, -i * depth * 0.1);
      standsGroup.add(stand);
    }
    
    // Add colored dots for audience
    for (let i = 0; i < 3; i++) {
      for (let j = -width/2 + 1; j < width/2; j += 2) {
        for (let k = -depth/2 + 1 + i * depth * 0.1; k < depth/2 - i * depth * 0.2; k += 2) {
          // Skip some positions randomly
          if (Math.random() < 0.3) continue;
          
          const personGeometry = new BoxGeometry(0.5, 0.5, 0.5);
          const personMaterial = new MeshStandardMaterial({ 
            color: Math.random() > 0.5 ? 0xff0000 : 
                   Math.random() > 0.5 ? 0x0000ff : 0x00ff00 
          });
          const person = new Mesh(personGeometry, personMaterial);
          person.position.set(j, 2.25 + i, k);
          standsGroup.add(person);
        }
      }
    }
    
    // Position and add to scene
    standsGroup.position.set(x, 0, z);
    standsGroup.rotation.y = rotation;
    this.scene.add(standsGroup);
  }
  
  /**
   * Create a track barrier to prevent cars from going off-track
   */
  private createTrackBarrier(centerX: number, centerZ: number, length: number, width: number, angle: number, material: MeshStandardMaterial): void {
    // Create two barriers, one for each side of the track
    const barrierHeight = 2.5; // Increased for better containment 
    const barrierWidth = 1.5;
    const halfWidth = width / 2 + barrierWidth / 2;
    
    // Create barrier geometries
    const barrierGeometry = new BoxGeometry(length + 4, barrierHeight, barrierWidth);
    
    // Left side barrier
    const leftBarrier = new Mesh(barrierGeometry, material);
    leftBarrier.position.set(
      centerX + Math.sin(angle) * halfWidth,
      barrierHeight / 2,
      centerZ - Math.cos(angle) * halfWidth
    );
    leftBarrier.rotation.y = angle;
    this.scene.add(leftBarrier);
    
    // Right side barrier
    const rightBarrier = new Mesh(barrierGeometry, material);
    rightBarrier.position.set(
      centerX - Math.sin(angle) * halfWidth,
      barrierHeight / 2,
      centerZ + Math.cos(angle) * halfWidth
    );
    rightBarrier.rotation.y = angle;
    this.scene.add(rightBarrier);
    
    // Add barrier tops (safety strip)
    const stripGeometry = new BoxGeometry(length + 4, 0.3, barrierWidth + 0.5);
    const stripMaterial = new MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 });
    
    // Left barrier top
    const leftStrip = new Mesh(stripGeometry, stripMaterial);
    leftStrip.position.set(
      centerX + Math.sin(angle) * halfWidth,
      barrierHeight + 0.15,
      centerZ - Math.cos(angle) * halfWidth
    );
    leftStrip.rotation.y = angle;
    this.scene.add(leftStrip);
    
    // Right barrier top
    const rightStrip = new Mesh(stripGeometry, stripMaterial);
    rightStrip.position.set(
      centerX - Math.sin(angle) * halfWidth,
      barrierHeight + 0.15,
      centerZ + Math.cos(angle) * halfWidth
    );
    rightStrip.rotation.y = angle;
    this.scene.add(rightStrip);
    
    // Add safety fence posts
    this.addSafetyFencePosts(centerX, centerZ, length, width, angle, barrierHeight);
  }
  
  /**
   * Add safety fence posts to track barriers
   */
  private addSafetyFencePosts(centerX: number, centerZ: number, length: number, width: number, angle: number, barrierHeight: number): void {
    const postSpacing = 5; // Space between posts
    const numPosts = Math.floor(length / postSpacing);
    const halfWidth = width / 2 + 0.75;
    const postHeight = 3; // Height of posts
    
    const postGeometry = new CylinderGeometry(0.15, 0.15, postHeight, 8);
    const postMaterial = new MeshStandardMaterial({ color: 0x888888 });
    
    // Calculate post positions along both sides of the track
    for (let i = 0; i < numPosts; i++) {
      const offset = (i * postSpacing) - (length / 2) + (postSpacing / 2);
      
      // Left side post
      const leftPostX = centerX + Math.cos(angle) * offset + Math.sin(angle) * halfWidth;
      const leftPostZ = centerZ + Math.sin(angle) * offset - Math.cos(angle) * halfWidth;
      const leftPost = new Mesh(postGeometry, postMaterial);
      leftPost.position.set(leftPostX, barrierHeight + postHeight / 2, leftPostZ);
      this.scene.add(leftPost);
      
      // Right side post
      const rightPostX = centerX + Math.cos(angle) * offset - Math.sin(angle) * halfWidth;
      const rightPostZ = centerZ + Math.sin(angle) * offset + Math.cos(angle) * halfWidth;
      const rightPost = new Mesh(postGeometry, postMaterial);
      rightPost.position.set(rightPostX, barrierHeight + postHeight / 2, rightPostZ);
      this.scene.add(rightPost);
    }
  }
  
  /**
   * Create a billboard with racing phrase
   */
  private createBillboard(x: number, z: number, text: string, angle: number): void {
    // Create a canvas for the billboard texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Draw background
    context.fillStyle = '#000066';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    context.strokeStyle = '#ffcc00';
    context.lineWidth = 8;
    context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    
    // Draw text
    context.fillStyle = '#ffffff';
    context.font = 'bold 72px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new CanvasTexture(canvas);
    
    // Create billboard mesh
    const billboardGeometry = new PlaneGeometry(10, 2.5);
    const billboardMaterial = new MeshStandardMaterial({
      map: texture,
      side: DoubleSide,
      transparent: true
    });
    
    const billboard = new Mesh(billboardGeometry, billboardMaterial);
    billboard.position.set(x, 3, z);
    billboard.rotation.y = angle;
    
    // Create support pole
    const poleGeometry = new BoxGeometry(0.3, 6, 0.3);
    const poleMaterial = new MeshStandardMaterial({ color: 0x888888 });
    const pole = new Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, -3, 0);
    
    // Group billboard and pole
    const billboardGroup = new Group();
    billboardGroup.add(billboard);
    billboardGroup.add(pole);
    this.scene.add(billboardGroup);
  }
  
  /**
   * Create a checkpoint entity
   */
  private createCheckpoint(index: number, x: number, z: number, isStartFinish: boolean): void {
    const checkpoint = new Entity();
    
    // Add transform component
    const transform = new TransformComponent();
    transform.setPosition(x, 1, z);
    checkpoint.addComponent(transform);
    
    // Add checkpoint component
    const checkpointComponent = new CheckpointComponent(index, isStartFinish);
    checkpoint.addComponent(checkpointComponent);
    
    // Create visual representation of checkpoint
    const checkpointGeometry = new BoxGeometry(10, 2, 1);
    const checkpointMaterial = new MeshStandardMaterial({ 
      color: isStartFinish ? 0xff0000 : 0x00ffff,
      transparent: true,
      opacity: 0.5
    });
    const checkpointMesh = new Mesh(checkpointGeometry, checkpointMaterial);
    
    // Add mesh component
    const meshComponent = new MeshComponent(checkpointMesh);
    checkpoint.addComponent(meshComponent);
    
    // Add to scene
    this.scene.add(checkpointMesh);
    
    // Add to world
    this.world.addEntity(checkpoint);
  }
  
  /**
   * Update player positions for UI
   */
  private updatePlayerPositions(): void {
    if (this.gameState !== GameState.RACING) return;
    
    // Get local player entity
    const playerEntity = this.playerEntities.get(this.localPlayerId);
    if (!playerEntity) return;
    
    // Get position from race system
    const position = this.raceSystem.getPlayerPosition(playerEntity.id);
    const totalPlayers = this.players.size;
    
    // Update UI
    if (this.onPositionUpdated) {
      this.onPositionUpdated(position, totalPlayers);
    }
  }
  
  /**
   * Set up a single player game
   */
  startSinglePlayerGame(trackInfo: TrackInfo): void {
    this.trackInfo = trackInfo;
    this.isHost = true;
    
    // Reset game state
    this.setGameState(GameState.LOADING);
    
    // Create track
    this.createTrack();
    
    // Set number of checkpoints in race system first
    // The track has 5 checkpoints (a square track with 4 corners + start/finish)
    console.log("[GameManager] Configuring race with lap count:", trackInfo.numLaps);
    this.raceSystem.configure(trackInfo.numLaps);
    this.raceSystem.registerCheckpoints();
    
    // Create player car
    this.createLocalPlayer();
    
    // Start game
    this.startGame();
    this.setGameState(GameState.COUNTDOWN);
    this.raceSystem.startCountdown();
  }
  
  /**
   * Host a multiplayer game
   */
  hostMultiplayerGame(trackInfo: TrackInfo): void {
    this.trackInfo = trackInfo;
    this.isHost = true;
    
    // Reset game state
    this.setGameState(GameState.LOBBY);
    
    // Other players will join via network events
  }
  
  /**
   * Start the chosen game
   */
  startGame(): void {
    // Start the game loop
    this.gameLoop.start();
    
    // Initialize camera follow
    this.resetCamera();
  }
  
  /**
   * Stop the game
   */
  stopGame(): void {
    // Stop the game loop
    this.gameLoop.stop();
    
    // Stop sounds
    if (this.soundManager) {
      this.soundManager.dispose();
    }
    
    // Reset game state
    this.setGameState(GameState.LOBBY);
    
    // Clear entities (in a real implementation we would do proper cleanup)
    // Clear Three.js scene
    // etc.
  }
  
  /**
   * Update game and render
   */
  update(): void {
    if (!this.renderer) return;
    
    // Update camera to follow player (in a real implementation this would be more sophisticated)
    this.updateCamera();
    
    // Update player positions for UI
    this.updatePlayerPositions();
    
    // Update sound effects based on player state
    this.updateSoundEffects();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Update camera to follow player car
   */
  private updateCamera(): void {
    const playerEntity = this.playerEntities.get(this.localPlayerId);
    if (!playerEntity) return;
    
    const transform = playerEntity.getComponent<TransformComponent>(ComponentTypes.TRANSFORM);
    if (!transform) return;
    
    // Simple third-person camera
    const targetPosition = transform.position.clone();
    const carDirection = transform.getForward().multiplyScalar(-10);
    carDirection.y = 5; // Height above car
    
    // Camera position behind the car
    this.camera.position.copy(targetPosition).add(carDirection);
    this.camera.lookAt(targetPosition);
  }
  
  /**
   * Update sound effects based on player state
   */
  private updateSoundEffects(): void {
    if (this.gameState !== GameState.RACING) return;
    
    // Get local player entity
    const playerEntity = this.playerEntities.get(this.localPlayerId);
    if (!playerEntity) return;
    
    // Get components
    const vehicle = playerEntity.getComponent<VehicleComponent>(ComponentTypes.VEHICLE);
    if (!vehicle) return;
    
    // Update engine sound based on vehicle state
    const speed = vehicle.velocity.length();
    this.soundManager.updateEngineSound(speed, vehicle.throttleInput);
    
    // Play tire screech when turning at high speed
    if (Math.abs(vehicle.steeringInput) > 0.5 && speed > 5) {
      const screechIntensity = Math.abs(vehicle.steeringInput) * (speed / 20);
      if (screechIntensity > 0.3) {
        this.soundManager.playTireScreech(screechIntensity);
      }
    }
  }
  
  /**
   * Set game state and trigger callback
   */
  private setGameState(state: GameState): void {
    console.log(`[GameManager] setGameState called. Current: ${this.gameState}, New: ${state}`); // Log state change attempt
    if (this.gameState === state) {
        console.log(`[GameManager] State is already ${state}, not changing.`); // Log no change
        return;
    }
    this.gameState = state;
    console.log(`[GameManager] Game state changed to: ${this.gameState}`); // Log successful change

    if (this.onGameStateChanged) {
      this.onGameStateChanged(state);
    }
  }
  
  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.gameState;
  }
  
  /**
   * Set callback for game state changes
   */
  setOnGameStateChanged(callback: (state: GameState) => void): void {
    this.onGameStateChanged = callback;
  }
  
  /**
   * Set callback for player joining
   */
  setOnPlayerJoined(callback: (player: PlayerInfo) => void): void {
    this.onPlayerJoined = callback;
  }
  
  /**
   * Set callback for player leaving
   */
  setOnPlayerLeft(callback: (playerId: string) => void): void {
    this.onPlayerLeft = callback;
  }
  
  /**
   * Set callback for race countdown
   */
  setOnCountdownTick(callback: (secondsRemaining: number) => void): void {
    this.onCountdownTick = callback;
  }
  
  /**
   * Set callback for position updates
   */
  setOnPositionUpdated(callback: (position: number, totalPlayers: number) => void): void {
    this.onPositionUpdated = callback;
  }
  
  /**
   * Set callback for lap completion
   */
  setOnLapCompleted(callback: (lapNumber: number, lapTime: number, bestLap: boolean) => void): void {
    this.onLapCompleted = callback;
  }
  
  /**
   * Create a small grandstand for spectators
   */
  private createGrandstand(x: number, z: number, rotation: number): void {
    const standGroup = new Group();
    
    // Base
    const baseGeometry = new BoxGeometry(4, 0.5, 2);
    const baseMaterial = new MeshStandardMaterial({ color: 0x444444 });
    const base = new Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.25, 0);
    standGroup.add(base);
    
    // Seats
    const seatsGeometry = new BoxGeometry(4, 1.5, 2);
    const seatsMaterial = new MeshStandardMaterial({ color: 0x2222cc });
    const seats = new Mesh(seatsGeometry, seatsMaterial);
    seats.position.set(0, 1.25, -0.5);
    seats.rotation.x = Math.PI / 8;
    standGroup.add(seats);
    
    // Add "spectators" (simple blocks)
    const spectatorSize = 0.25;
    const spectatorGeometry = new BoxGeometry(spectatorSize, spectatorSize * 2, spectatorSize);
    
    for (let i = 0; i < 8; i++) {
      const randomColor = new Color(Math.random() * 0.8, Math.random() * 0.8, Math.random() * 0.8);
      const spectatorMaterial = new MeshStandardMaterial({ color: randomColor });
      const spectator = new Mesh(spectatorGeometry, spectatorMaterial);
      
      // Position on the stands with some randomness
      const rowPosition = (i % 4) - 1.5; 
      const seatPosition = Math.floor(i / 4) - 0.5;
      spectator.position.set(
        rowPosition * 0.8 + (Math.random() * 0.2 - 0.1),
        1.5 + seatPosition * 0.4,
        -0.5 + seatPosition * 0.4
      );
      standGroup.add(spectator);
    }
    
    // Position and rotate the stand
    standGroup.position.set(x, 0.1, z);
    standGroup.rotation.y = rotation;
    
    this.scene.add(standGroup);
  }
  
  /**
   * Create a small barrel for decoration
   */
  private createSmallBarrel(x: number, z: number): void {
    const barrelGroup = new Group();
    
    // Barrel body
    const barrelGeometry = new CylinderGeometry(0.5, 0.5, 1.2, 16);
    const barrelMaterial = new MeshStandardMaterial({ color: Math.random() > 0.5 ? 0xff3300 : 0x0033ff });
    const barrel = new Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0, 0.6, 0);
    barrelGroup.add(barrel);
    
    // Barrel rings
    const ringGeometry = new TorusGeometry(0.52, 0.05, 8, 32);
    const ringMaterial = new MeshStandardMaterial({ color: 0x888888 });
    
    const topRing = new Mesh(ringGeometry, ringMaterial);
    topRing.position.set(0, 1.0, 0);
    topRing.rotation.x = Math.PI / 2;
    barrelGroup.add(topRing);
    
    const middleRing = new Mesh(ringGeometry, ringMaterial);
    middleRing.position.set(0, 0.6, 0);
    middleRing.rotation.x = Math.PI / 2;
    barrelGroup.add(middleRing);
    
    const bottomRing = new Mesh(ringGeometry, ringMaterial);
    bottomRing.position.set(0, 0.2, 0);
    bottomRing.rotation.x = Math.PI / 2;
    barrelGroup.add(bottomRing);
    
    // Add some randomization to position and rotation
    const offsetX = (Math.random() - 0.5) * 1.5;
    const offsetZ = (Math.random() - 0.5) * 1.5;
    const rotation = Math.random() * Math.PI * 2;
    
    barrelGroup.position.set(x + offsetX, 0.1, z + offsetZ);
    barrelGroup.rotation.y = rotation;
    
    this.scene.add(barrelGroup);
  }
  
  /**
   * Create a pit stop area
   */
  private createPitStop(x: number, z: number): void {
    const pitStopGroup = new Group();
    
    // Pit stop platform
    const platformGeometry = new BoxGeometry(10, 0.2, 5);
    const platformMaterial = new MeshStandardMaterial({ color: 0x333333 });
    const platform = new Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 0.1, 0);
    pitStopGroup.add(platform);
    
    // Pit stop garage roof
    const roofGeometry = new BoxGeometry(10, 0.3, 7);
    const roofMaterial = new MeshStandardMaterial({ color: 0xcccccc });
    const roof = new Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 4, -1);
    pitStopGroup.add(roof);
    
    // Garage pillars
    const pillarGeometry = new BoxGeometry(0.3, 4, 0.3);
    const pillarMaterial = new MeshStandardMaterial({ color: 0x666666 });
    
    // Create 4 pillars
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const pillar = new Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(i * 4.5, 2, j * 2.5);
        pitStopGroup.add(pillar);
      }
    }
    
    // Tool boxes and equipment
    const toolboxGeometry = new BoxGeometry(1, 0.8, 0.5);
    const toolboxMaterial = new MeshStandardMaterial({ color: 0xff0000 });
    const toolbox = new Mesh(toolboxGeometry, toolboxMaterial);
    toolbox.position.set(-3, 0.6, -1.5);
    pitStopGroup.add(toolbox);
    
    // Tire stack
    const tireGeometry = new TorusGeometry(0.5, 0.2, 16, 32);
    const tireMaterial = new MeshStandardMaterial({ color: 0x111111 });
    
    // Create stack of tires
    for (let i = 0; i < 3; i++) {
      const tire = new Mesh(tireGeometry, tireMaterial);
      tire.position.set(3, 0.2 + (i * 0.4), -1.5);
      tire.rotation.x = Math.PI / 2;
      pitStopGroup.add(tire);
    }
    
    // Position the pit stop
    pitStopGroup.position.set(x, 0, z);
    pitStopGroup.rotation.y = Math.PI / 4;
    
    this.scene.add(pitStopGroup);
  }
} 