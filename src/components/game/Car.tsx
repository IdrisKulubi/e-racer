'use client';

import dynamic from 'next/dynamic';

// Dynamically import ThreeJSCar with no SSR to avoid hydration issues
const ThreeJSCar = dynamic(() => import('./ThreeJSCar'), { ssr: false });

interface CarProps {
  type: 'sport' | 'muscle' | 'compact';
  color: string;
  name: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function Car({ type, color, name, isSelected = false, onClick }: CarProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded border transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-900/30'
          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
      }`}
    >
      <div className="h-32 flex items-center justify-center mb-2 relative">
        <div 
          className="absolute inset-0 opacity-10 rounded" 
          style={{ backgroundColor: color }}
        />
        <div className="w-full h-full">
          <ThreeJSCar type={type} color={color} />
        </div>
      </div>
      <div className="text-center font-medium">{name}</div>
    </button>
  );
} 