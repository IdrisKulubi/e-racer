'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Car from '@/components/game/Car';
import Track from '@/components/game/Track';
import ColorPicker from '@/components/ui/ColorPicker';
import StartGameButton from '@/components/ui/StartGameButton';

interface Track {
  id: string;
  name: string;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CarOption {
  type: 'sport' | 'muscle' | 'compact';
  name: string;
  image: string;
}

// Available tracks
const TRACKS: Track[] = [
  {
    id: 'default',
    name: 'City Circuit',
    image: '/tracks/city.jpg',
    difficulty: 'medium'
  },
  {
    id: 'desert',
    name: 'Desert Run',
    image: '/tracks/desert.jpg',
    difficulty: 'easy'
  },
  {
    id: 'snow',
    name: 'Snow Valley',
    image: '/tracks/snow.jpg',
    difficulty: 'hard'
  }
];

// Car options
const CAR_OPTIONS: CarOption[] = [
  {
    type: 'sport',
    name: 'Sport',
    image: '/cars/sport.jpg'
  },
  {
    type: 'muscle',
    name: 'Muscle',
    image: '/cars/muscle.jpg'
  },
  {
    type: 'compact',
    name: 'Compact',
    image: '/cars/compact.jpg'
  }
];

// Color options
const COLOR_OPTIONS: string[] = [
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff'  // Cyan
];

export default function LobbyPage() {
  const router = useRouter();
  
  // Player settings
  const [playerName, setPlayerName] = useState('Player1');
  const [selectedCar, setSelectedCar] = useState<CarOption>(CAR_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  
  // Game settings
  const [selectedTrack, setSelectedTrack] = useState<Track>(TRACKS[0]);
  const [gameMode, setGameMode] = useState<'single' | 'multi'>('single');
  const [lobbyCode, setLobbyCode] = useState('');
  
  // Validation
  const isValid = playerName.trim().length > 0;
  
  // Start game
  const handleStartGame = () => {
    // Build query params
    const params = new URLSearchParams();
    params.set('mode', gameMode);
    params.set('name', playerName);
    params.set('color', selectedColor);
    params.set('type', selectedCar.type);
    params.set('track', selectedTrack.id);
    
    // Add lobby code for multiplayer
    if (gameMode === 'multi' && lobbyCode) {
      params.set('lobby', lobbyCode);
    }
    
    // Navigate to game page
    router.push(`/game?${params.toString()}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">E-Racer</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Player Settings</h2>
          
          <div className="mb-6">
            <label className="block mb-2">Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
              maxLength={15}
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2">Car Type</label>
            <div className="grid grid-cols-3 gap-4">
              {CAR_OPTIONS.map((car) => (
                <Car
                  key={car.type}
                  type={car.type}
                  name={car.name}
                  color={selectedColor}
                  isSelected={selectedCar.type === car.type}
                  onClick={() => setSelectedCar(car)}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2">Car Color</label>
            <ColorPicker 
              colors={COLOR_OPTIONS}
              selectedColor={selectedColor}
              onChange={setSelectedColor}
            />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Game Settings</h2>
          
          <div className="mb-6">
            <label className="block mb-2">Game Mode</label>
            <div className="flex gap-4">
              <button
                onClick={() => setGameMode('single')}
                className={`py-2 px-4 rounded ${
                  gameMode === 'single'
                    ? 'bg-blue-600'
                    : 'bg-gray-700'
                }`}
              >
                Single Player
              </button>
              <button
                onClick={() => setGameMode('multi')}
                className={`py-2 px-4 rounded ${
                  gameMode === 'multi'
                    ? 'bg-blue-600'
                    : 'bg-gray-700'
                }`}
              >
                Multiplayer
              </button>
            </div>
          </div>
          
          {gameMode === 'multi' && (
            <div className="mb-6">
              <label className="block mb-2">Lobby Code</label>
              <input
                type="text"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value)}
                placeholder="Enter code or leave blank to create new lobby"
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          
          <div className="mb-6">
            <label className="block mb-2">Track</label>
            <div className="grid grid-cols-3 gap-4">
              {TRACKS.map((track) => (
                <Track
                  key={track.id}
                  id={track.id}
                  name={track.name}
                  difficulty={track.difficulty}
                  image={track.image}
                  isSelected={selectedTrack.id === track.id}
                  onClick={() => setSelectedTrack(track)}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="py-2 px-6 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Back
          </Link>
          
          <StartGameButton 
            isValid={isValid} 
            onClick={handleStartGame} 
            mode={gameMode}
            hasLobbyCode={!!lobbyCode}
          />
        </div>
      </div>
    </div>
  );
} 