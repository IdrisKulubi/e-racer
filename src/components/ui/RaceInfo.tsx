'use client';

import { useState, useEffect } from 'react';
import { LapCounterComponent } from '@/lib/game/components/LapCounterComponent';

interface RaceInfoProps {
  currentLap: number;
  totalLaps: number;
  currentPosition: number;
  totalPlayers: number;
  currentLapTime?: number;
  bestLapTime?: number;
  lastLapTime?: number;
  countdown?: number;
  isRacing: boolean;
  isFinished: boolean;
}

export default function RaceInfo({
  currentLap = 1,
  totalLaps = 3,
  currentPosition = 1,
  totalPlayers = 1,
  currentLapTime = 0,
  bestLapTime,
  lastLapTime,
  countdown,
  isRacing = false,
  isFinished = false
}: RaceInfoProps) {
  // Format time values
  const formatTime = (time?: number): string => {
    if (time === undefined) return '--:--:--';
    return LapCounterComponent.formatTime(time);
  };
  
  // Determine ordinal suffix for position
  const getPositionSuffix = (position: number): string => {
    if (position === 1) return 'st';
    if (position === 2) return 'nd';
    if (position === 3) return 'rd';
    return 'th';
  };
  
  // Timer for current lap
  const [timer, setTimer] = useState(0);
  
  // Update timer when racing
  useEffect(() => {
    if (!isRacing || isFinished) return;
    
    let startTime = Date.now() - (currentLapTime || 0);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setTimer(elapsed);
    }, 10);
    
    return () => clearInterval(interval);
  }, [isRacing, isFinished, currentLapTime]);
  
  return (
    <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-start text-white font-mono text-shadow-sm z-10">
      {/* Countdown overlay */}
      {countdown !== undefined && countdown > 0 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-9xl font-bold">{countdown}</div>
        </div>
      )}
      
      {/* Finish overlay */}
      {isFinished && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
          <div className="text-5xl font-bold mb-8">
            {currentPosition === 1 ? 'YOU WON!' : `FINISHED ${currentPosition}${getPositionSuffix(currentPosition)}`}
          </div>
          <div className="text-2xl">
            Best Lap: {formatTime(bestLapTime)}
          </div>
        </div>
      )}
      
      {/* Race position */}
      <div className="bg-black/50 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-3xl font-bold">
          {currentPosition}/{totalPlayers}
          <span className="text-xl"> {currentPosition}{getPositionSuffix(currentPosition)}</span>
        </div>
      </div>
      
      {/* Lap counter */}
      <div className="bg-black/50 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-2xl">
          LAP {currentLap}/{totalLaps}
        </div>
      </div>
      
      {/* Lap times */}
      <div className="bg-black/50 rounded-lg p-3 backdrop-blur-sm min-w-[200px]">
        <div className="flex flex-col">
          <div className="flex justify-between">
            <span>Current:</span>
            <span className="font-bold">{formatTime(isRacing ? timer : currentLapTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Best:</span>
            <span className="font-bold text-green-400">{formatTime(bestLapTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Last:</span>
            <span className="font-bold text-yellow-400">{formatTime(lastLapTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 