import type { NextRequest } from 'next/server';
import { Server } from 'socket.io';
import { type Socket } from 'socket.io-client';
import { createServer } from 'http';

// Track player information
interface Player {
  id: string;
  name: string;
  car: {
    color: string;
    type: 'sport' | 'muscle' | 'compact';
  };
}

// Track race information
interface RaceInfo {
  id: string;
  name: string;
  numLaps: number;
  players: Player[];
  hostId: string;
  inProgress: boolean;
}

// Active races
const activeRaces = new Map<string, RaceInfo>();

// Player to race mapping
const playerRaceMap = new Map<string, string>();

// Socket.io server instance
let io: Server | null = null;

// Set up Socket.io server
function getSocketIO() {
  if (!io) {
    // Create HTTP server
    const httpServer = createServer();
    
    // Create Socket.io server
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      path: '/api/socket'
    });
    
    // Set up event handlers
    io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);
      
      // Store player information on connect
      socket.on('playerJoin', (player: Player) => {
        console.log('Player joined:', player.name);
        
        // Broadcast to other players
        socket.broadcast.emit('playerJoin', player);
      });
      
      // Handle player leaving
      socket.on('disconnect', () => {
        // Find player race
        const raceId = playerRaceMap.get(socket.id);
        if (raceId) {
          const race = activeRaces.get(raceId);
          if (race) {
            // Remove player from race
            race.players = race.players.filter(p => p.id !== socket.id);
            
            // If host left, end the race
            if (race.hostId === socket.id) {
              // Notify all players in the race
              io?.to(raceId).emit('raceEnded', { reason: 'hostLeft' });
              activeRaces.delete(raceId);
            } else if (race.players.length === 0) {
              // No players left, remove race
              activeRaces.delete(raceId);
            }
          }
          
          // Remove player from mapping
          playerRaceMap.delete(socket.id);
        }
        
        // Notify other players
        socket.broadcast.emit('playerLeave', { playerId: socket.id });
        console.log('Client disconnected:', socket.id);
      });
      
      // Create a new race
      socket.on('createRace', (raceInfo: Omit<RaceInfo, 'players' | 'hostId' | 'inProgress'>) => {
        const raceId = `race_${Date.now()}`;
        
        // Create race info
        const race: RaceInfo = {
          ...raceInfo,
          id: raceId,
          players: [],
          hostId: socket.id,
          inProgress: false
        };
        
        // Add to active races
        activeRaces.set(raceId, race);
        
        // Join socket to race room
        socket.join(raceId);
        
        // Map player to race
        playerRaceMap.set(socket.id, raceId);
        
        // Send confirmation
        socket.emit('raceCreated', race);
        console.log('Race created:', raceId);
      });
      
      // Join an existing race
      socket.on('joinRace', ({ raceId, player }: { raceId: string, player: Player }) => {
        const race = activeRaces.get(raceId);
        
        if (!race) {
          // Race doesn't exist
          socket.emit('joinError', { message: 'Race not found' });
          return;
        }
        
        if (race.inProgress) {
          // Race already started
          socket.emit('joinError', { message: 'Race already in progress' });
          return;
        }
        
        // Add player to race
        race.players.push(player);
        
        // Join socket to race room
        socket.join(raceId);
        
        // Map player to race
        playerRaceMap.set(socket.id, raceId);
        
        // Notify all players in the race
        io?.to(raceId).emit('playerJoinedRace', player);
        
        // Send race info to new player
        socket.emit('raceJoined', race);
        console.log('Player joined race:', player.name, raceId);
      });
      
      // Start the race
      socket.on('startRace', ({ raceId }: { raceId: string }) => {
        const race = activeRaces.get(raceId);
        
        if (!race) {
          socket.emit('startError', { message: 'Race not found' });
          return;
        }
        
        if (race.hostId !== socket.id) {
          socket.emit('startError', { message: 'Only the host can start the race' });
          return;
        }
        
        // Set race as in progress
        race.inProgress = true;
        
        // Notify all players in the race
        io?.to(raceId).emit('raceStarting', { countdown: 3 });
        console.log('Race starting:', raceId);
        
        // Start countdown
        let countdown = 3;
        const timer = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            io?.to(raceId).emit('raceCountdown', { countdown });
          } else {
            clearInterval(timer);
            io?.to(raceId).emit('raceStarted', {});
            console.log('Race started:', raceId);
          }
        }, 1000);
      });
      
      // Handle transform updates
      socket.on('transform', (data) => {
        const raceId = playerRaceMap.get(socket.id);
        if (raceId) {
          // Relay to all other players in the race
          socket.to(raceId).emit('transform', data);
        }
      });
      
      // Handle vehicle updates
      socket.on('vehicle', (data) => {
        const raceId = playerRaceMap.get(socket.id);
        if (raceId) {
          // Relay to all other players in the race
          socket.to(raceId).emit('vehicle', data);
        }
      });
      
      // Handle checkpoint passing
      socket.on('checkpointPassed', (data) => {
        const raceId = playerRaceMap.get(socket.id);
        if (raceId) {
          // Relay to all other players in the race
          socket.to(raceId).emit('checkpointPassed', data);
        }
      });
      
      // Handle lap completion
      socket.on('lapCompleted', (data) => {
        const raceId = playerRaceMap.get(socket.id);
        if (raceId) {
          // Relay to all other players in the race
          socket.to(raceId).emit('lapCompleted', data);
        }
      });
      
      // Handle race finish
      socket.on('raceFinished', (data) => {
        const raceId = playerRaceMap.get(socket.id);
        if (raceId) {
          const race = activeRaces.get(raceId);
          if (race) {
            // Relay to all other players in the race
            socket.to(raceId).emit('playerFinished', {
              playerId: socket.id,
              ...data
            });
            
            // Check if all players finished
            const allFinished = race.players.every(p => 
              p.id === socket.id || data.finishedPlayers.includes(p.id)
            );
            
            if (allFinished) {
              // End the race
              io?.to(raceId).emit('raceEnded', { reason: 'completed' });
              race.inProgress = false;
            }
          }
        }
      });
    });
    
    // Start listening on port
    httpServer.listen(3001);
  }
  
  return io;
}

// API route handler
export async function GET(req: NextRequest) {
  // Initialize Socket.io
  getSocketIO();
  
  return new Response('Socket.io server running', {
    status: 200
  });
}

export const dynamic = 'force-dynamic'; 