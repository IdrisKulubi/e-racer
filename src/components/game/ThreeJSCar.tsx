'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BoxGeometry, CylinderGeometry, MeshStandardMaterial, Vector3 } from 'three';

// Car model based on car type
const CarModel = ({ type, color }: { type: 'sport' | 'muscle' | 'compact'; color: string }) => {
  const carGroup = useRef<THREE.Group>(null);
  
  // Rotate the car for better view
  useFrame(() => {
    if (carGroup.current) {
      carGroup.current.rotation.y += 0.01;
    }
  });
  
  // Define car dimensions based on type
  let bodyDimensions;
  if (type === 'sport') {
    bodyDimensions = [2, 0.5, 4]; // width, height, length
  } else if (type === 'muscle') {
    bodyDimensions = [2.2, 0.6, 4.2];
  } else {
    bodyDimensions = [1.8, 0.7, 3.5];
  }
  
  return (
    <group ref={carGroup}>
      {/* Car body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={bodyDimensions} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Wheels */}
      {[
        [-1, 0.4, -1.5], // Front left
        [1, 0.4, -1.5],  // Front right
        [-1, 0.4, 1.5],  // Rear left
        [1, 0.4, 1.5]    // Rear right
      ].map((position, index) => (
        <mesh 
          key={index} 
          position={position as [number, number, number]} 
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      ))}
    </group>
  );
};

interface ThreeJSCarProps {
  type: 'sport' | 'muscle' | 'compact';
  color: string;
}

export default function ThreeJSCar({ type, color }: ThreeJSCarProps) {
  return (
    <div className="h-full w-full">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <CarModel type={type} color={color} />
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
} 