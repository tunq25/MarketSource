"use client"

import { useRef, useEffect, useState, Component } from 'react'

// Main component - import Three.js dynamically in runtime
export function ThreeJSHero() {
  const [mounted, setMounted] = useState(false)
  const [ThreeJSComponents, setThreeJSComponents] = useState<{
    Canvas: any
    HeroScene: any
    ErrorBoundary: any
  } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Dynamic import trong runtime, không phải trong module evaluation
    Promise.all([
      import('@react-three/fiber'),
      import('@react-three/drei'),
      import('three')
    ])
      .then(([fiber, drei, three]) => {
        const { Canvas, useFrame, useThree } = fiber
        const THREE = three

        // Animated geometric shapes thay thế Text3D
        function AnimatedShapes({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
          const groupRef = useRef<any>(null)

          useFrame((state: any) => {
            if (groupRef.current) {
              groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
              groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.1
              groupRef.current.position.x = position[0]
              groupRef.current.position.z = position[2]
    }
  })

  return (
            <group ref={groupRef} position={position}>
              {/* Icosahedron thay thế text */}
              <mesh>
                <icosahedronGeometry args={[0.6, 0]} />
                <meshStandardMaterial color="#8b5cf6" transparent opacity={0.8} />
              </mesh>
              {/* Orbiting rings */}
              <mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.3, 0.05, 8, 16]} />
                <meshStandardMaterial color="#ec4899" transparent opacity={0.7} />
              </mesh>
              <mesh position={[-1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.3, 0.05, 8, 16]} />
                <meshStandardMaterial color="#06b6d4" transparent opacity={0.7} />
              </mesh>
            </group>
  )
}

// Particle system
        function ParticleField({ count = 200 }: { count?: number }) {
          const points = useRef<any>(null)
          const positions = useRef<Float32Array | null>(null)

  useEffect(() => {
    const positionsArray = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positionsArray[i * 3] = (Math.random() - 0.5) * 20
      positionsArray[i * 3 + 1] = (Math.random() - 0.5) * 20
      positionsArray[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    positions.current = positionsArray
  }, [count])

          useFrame((state: any) => {
    if (points.current && positions.current) {
              const positionsArray = points.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
                positionsArray[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001
                positionsArray[i * 3] += Math.cos(state.clock.elapsedTime + i) * 0.0005
      }
      points.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
                {positions.current && (
        <bufferAttribute
          attach="attributes-position"
          count={count}
                    array={positions.current}
          itemSize={3}
        />
                )}
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#a855f7" transparent opacity={0.6} />
    </points>
  )
}

// Rotating geometric shapes
function RotatingShapes() {
          const groupRef = useRef<any>(null)

          useFrame((state: any) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.1
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central icosahedron */}
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#ec4899" 
          transparent 
          opacity={0.3}
          wireframe
        />
      </mesh>
      
      {/* Orbiting rings */}
      <mesh position={[2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.5, 0.1, 8, 16]} />
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.7} />
      </mesh>
      
      <mesh position={[-2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.5, 0.1, 8, 16]} />
        <meshStandardMaterial color="#10b981" transparent opacity={0.7} />
      </mesh>
      
      {/* Floating spheres */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.8} />
      </mesh>
      
      <mesh position={[0, -2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

// Main scene
function HeroScene() {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 0, 10)
  }, [camera])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      
      <ParticleField count={150} />
      <RotatingShapes />
      
              {/* Animated shapes thay thế 3D Text */}
              <AnimatedShapes position={[0, 1, 0]} />
              <AnimatedShapes position={[0, -1, 0]} />
    </>
  )
}

        // Error Boundary
        class ThreeJSErrorBoundary extends Component<
          { children: React.ReactNode },
          { hasError: boolean }
        > {
          constructor(props: { children: React.ReactNode }) {
            super(props)
            this.state = { hasError: false }
          }

          static getDerivedStateFromError() {
            return { hasError: true }
          }

          componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
            // Logger có thể chưa được load, dùng console.error làm fallback
            try {
              import('@/lib/logger-client').then(({ logger }) => {
                logger.error('Three.js Hero Error', error, {
                  componentStack: errorInfo.componentStack,
                })
              }).catch(() => {
                console.error('Three.js Hero Error:', error, {
                  componentStack: errorInfo.componentStack,
                })
              })
            } catch {
              console.error('Three.js Hero Error:', error, {
                componentStack: errorInfo.componentStack,
              })
            }
          }

          render() {
            if (this.state.hasError) {
              return (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-blue-100/30 dark:from-purple-900/50 dark:via-pink-900/30 dark:to-blue-900/50" />
              )
            }

            return this.props.children
          }
        }

        setThreeJSComponents({
          Canvas,
          HeroScene,
          ErrorBoundary: ThreeJSErrorBoundary
        })
      })
      .catch(async (err) => {
        try {
          const { logger } = await import('@/lib/logger-client')
          logger.error('Failed to load Three.js Hero', err)
        } catch {
          console.error('Failed to load Three.js Hero:', err)
        }
        setError(true)
      })
  }, [])

  if (!mounted) {
    return (
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-blue-100/30 dark:from-purple-900/50 dark:via-pink-900/30 dark:to-blue-900/50"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-blue-100/30 dark:from-purple-900/50 dark:via-pink-900/30 dark:to-blue-900/50"></div>
      </div>
    )
  }

  if (!ThreeJSComponents) {
    return (
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-pink-100/10 to-blue-100/20 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-blue-900/30"></div>
      </div>
    )
  }

  const { Canvas, HeroScene, ErrorBoundary } = ThreeJSComponents

  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-pink-100/10 to-blue-100/20 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-blue-900/30"></div>
      
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 75 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
        >
          <HeroScene />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
