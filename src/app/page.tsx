import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            E-RACER
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            An immersive multiplayer racing experience built with Next.js and Three.js
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700 flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Features</h2>
            <ul className="space-y-3 text-gray-300 mb-8 flex-1">
              <li className="flex items-start">
                <span className="mr-2 text-green-400">✓</span>
                Realistic vehicle physics with acceleration, braking, and steering
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-400">✓</span>
                Multiple race tracks with checkpoints and lap timing
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-400">✓</span>
                Real-time multiplayer with position tracking
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-400">✓</span>
                Customizable vehicles with different types and colors
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-400">✓</span>
                Race position tracking and lap statistics
              </li>
            </ul>
            <Link 
              href="/lobby" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-lg text-center transition-all"
            >
              Enter Lobby
            </Link>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700 flex flex-col">
            {/* This would be a game preview/screenshot */}
            <div className="h-48 md:h-64 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
              <span className="text-xl font-bold">Game Preview</span>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">How to Play</h2>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2 font-bold">W / ↑</span>
                  <span>Accelerate</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">S / ↓</span>
                  <span>Brake</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">A / ←</span>
                  <span>Steer left</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">D / →</span>
                  <span>Steer right</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex gap-6 justify-center">
          <Link 
            href="/game?mode=single" 
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Quick Race
          </Link>
          <Link 
            href="/lobby" 
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Multiplayer
          </Link>
        </div>
      </div>
      
      <footer className="mt-16 text-sm text-gray-500">
        © 2023 E-Racer | Built with Next.js and Three.js
      </footer>
    </div>
  );
}
