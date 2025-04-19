'use client';

import { useEffect, useRef, useState } from 'react';
import { GameManager, GameState, CarOptions, TrackInfo } from '@/lib/game/GameManager';

interface GameCanvasProps {
  singlePlayer?: boolean;
  playerName?: string;
  carOptions?: CarOptions;
  trackInfo?: TrackInfo;
  onGameStateChanged?: (state: GameState) => void;
  onLapCompleted?: (lapNumber: number, lapTime: number, isBestLap: boolean) => void;
  onPositionUpdated?: (position: number, totalPlayers: number) => void;
  onCountdownTick?: (seconds: number) => void;
}

const DEFAULT_CAR_OPTIONS: CarOptions = {
  color: '#ff0000',
  type: 'sport'
};

const DEFAULT_TRACK_INFO: TrackInfo = {
  id: 'default',
  name: 'Default Track',
  numLaps: 3,
  difficulty: 'medium'
};

export default function GameCanvas({
  singlePlayer = true,
  playerName = 'Player1',
  carOptions = DEFAULT_CAR_OPTIONS,
  trackInfo = DEFAULT_TRACK_INFO,
  onGameStateChanged,
  onLapCompleted,
  onPositionUpdated,
  onCountdownTick
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const animationFrameRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (!canvasRef.current || hasInitializedRef.current) return;
    
    console.log("[GameCanvas] Initializing game...");
    
    hasInitializedRef.current = true;
    
    const gameManager = new GameManager();
    gameManagerRef.current = gameManager;
    
    gameManager.initRenderer(canvasRef.current);
    
    if (onGameStateChanged) {
      gameManager.setOnGameStateChanged(onGameStateChanged);
    }
    
    if (onLapCompleted) {
      gameManager.setOnLapCompleted(onLapCompleted);
    }
    
    if (onPositionUpdated) {
      gameManager.setOnPositionUpdated(onPositionUpdated);
    }
    
    if (onCountdownTick) {
      gameManager.setOnCountdownTick(onCountdownTick);
    }
    
    if (singlePlayer) {
      gameManager.startSinglePlayerGame(trackInfo);
    } else {
      const serverUrl = `${window.location.protocol}//${window.location.host}/api/socket`;
      gameManager.connectToServer(serverUrl, playerName, carOptions)
        .then(() => {
          gameManager.hostMultiplayerGame(trackInfo);
        })
        .catch(error => {
          console.error('Failed to connect to server:', error);
        });
    }
    
    const animate = () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.update();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      console.log("[GameCanvas] Cleaning up game...");
      cancelAnimationFrame(animationFrameRef.current);
      if (gameManagerRef.current) {
        if (!singlePlayer) {
          gameManagerRef.current.disconnect();
        }
        gameManagerRef.current.stopGame();
        gameManagerRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !gameManagerRef.current) return;
      
      const container = canvasRef.current.parentElement;
      if (!container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      gameManagerRef.current.resizeRenderer(width, height);
    };
    
    if (hasInitializedRef.current) {
      handleResize();
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [hasInitializedRef.current]);
  
  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
} 