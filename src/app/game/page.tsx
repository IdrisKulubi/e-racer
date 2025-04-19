'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GameCanvas from '@/components/game/GameCanvas';
import RaceInfo from '@/components/ui/RaceInfo';
import { GameState } from '@/lib/game/GameManager';

export default function GamePage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'single';
  const playerName = searchParams.get('name') || 'Player1';
  const carColor = searchParams.get('color') || '#ff0000';
  const carType = searchParams.get('type') || 'sport';
  const trackId = searchParams.get('track') || 'default';
  
  // Race state
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [currentLap, setCurrentLap] = useState(1);
  const [totalLaps, setTotalLaps] = useState(3);
  const [currentPosition, setCurrentPosition] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(1);
  const [currentLapTime, setCurrentLapTime] = useState(0);
  const [bestLapTime, setBestLapTime] = useState<number | undefined>(undefined);
  const [lastLapTime, setLastLapTime] = useState<number | undefined>(undefined);
  const [countdown, setCountdown] = useState<number | undefined>(undefined);
  
  // Set up track info based on selected track
  const trackInfo = {
    id: trackId,
    name: trackId === 'desert' ? 'Desert Run' : trackId === 'snow' ? 'Snow Valley' : 'City Circuit',
    numLaps: 3,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  };
  
  // Set up car options
  const carOptions = {
    color: carColor,
    type: (carType === 'sport' || carType === 'muscle' || carType === 'compact') 
      ? carType 
      : 'sport'
  };
  
  // Handle game state changes
  const handleGameStateChanged = (state: GameState) => {
    setGameState(state);
    
    if (state === GameState.COUNTDOWN) {
      setCountdown(3);
    } else if (state === GameState.RACING) {
      setCountdown(undefined);
    }
  };
  
  // Handle lap completion
  const handleLapCompleted = (lapNumber: number, lapTime: number, isBestLap: boolean) => {
    setCurrentLap(lapNumber + 1);
    setLastLapTime(lapTime);
    if (isBestLap) {
      setBestLapTime(lapTime);
    }
  };
  
  // Handle position updates
  const handlePositionUpdated = (position: number, players: number) => {
    setCurrentPosition(position);
    setTotalPlayers(players);
  };
  
  // Handle countdown
  const handleCountdownTick = (seconds: number) => {
    setCountdown(seconds);
  };
  
  return (
    <div className="h-screen w-screen relative">
      {/* Game canvas */}
      <GameCanvas
        singlePlayer={mode === 'single'}
        playerName={playerName}
        carOptions={carOptions}
        trackInfo={trackInfo}
        onGameStateChanged={handleGameStateChanged}
        onLapCompleted={handleLapCompleted}
        onPositionUpdated={handlePositionUpdated}
        onCountdownTick={handleCountdownTick}
      />
      
      {/* UI overlay */}
      <RaceInfo
        currentLap={currentLap}
        totalLaps={totalLaps}
        currentPosition={currentPosition}
        totalPlayers={totalPlayers}
        currentLapTime={currentLapTime}
        bestLapTime={bestLapTime}
        lastLapTime={lastLapTime}
        countdown={countdown}
        isRacing={gameState === GameState.RACING}
        isFinished={gameState === GameState.FINISHED}
      />
    </div>
  );
} 