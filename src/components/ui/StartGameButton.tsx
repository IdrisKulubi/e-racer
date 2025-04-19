'use client';

interface StartGameButtonProps {
  isValid: boolean;
  onClick: () => void;
  mode: 'single' | 'multi';
  hasLobbyCode: boolean;
}

export default function StartGameButton({ isValid, onClick, mode, hasLobbyCode }: StartGameButtonProps) {
  const buttonText = mode === 'single' 
    ? 'Start Game' 
    : hasLobbyCode 
      ? 'Join Game' 
      : 'Create Game';

  return (
    <button
      onClick={onClick}
      disabled={!isValid}
      className={`py-3 px-8 rounded-lg font-medium text-lg transition-all ${
        isValid
          ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
          : 'bg-gray-600 cursor-not-allowed opacity-50'
      }`}
    >
      {buttonText}
    </button>
  );
} 