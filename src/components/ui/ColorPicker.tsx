'use client';

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ colors, selectedColor, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-10 h-10 rounded-full transition-all ${
            selectedColor === color 
              ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110' 
              : 'hover:scale-105'
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
} 