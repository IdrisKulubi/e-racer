'use client';

import Image from 'next/image';

interface TrackProps {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  image: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function Track({ id, name, difficulty, image, isSelected = false, onClick }: TrackProps) {
  const difficultyColors = {
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-red-400'
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded border transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-900/30'
          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
      }`}
    >
      <div className="h-24 flex items-center justify-center mb-2 overflow-hidden rounded">
        <Image
          src={image}
          alt={`${name} track`}
          width={180}
          height={120}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="text-center font-medium">{name}</div>
      <div className={`text-center text-sm ${difficultyColors[difficulty]}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </div>
    </button>
  );
} 