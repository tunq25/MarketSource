"use client"

import { useRef, useEffect, useState, Component } from 'react'

// Main component - import Three.js dynamically in runtime
export function ThreeJSProductShowcase() {
  const [mounted, setMounted] = useState(false)
  const [ThreeJSComponents, setThreeJSComponents] = useState<{
    Canvas: any
    ProductScene: any
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

// Interactive 3D product representation
function ProductModel({ type = 'box' }: { type?: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' }) {
          const meshRef = useRef<any>(null)
  const [hovered, setHovered] = useState(false)

          useFrame((state: any) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
      meshRef.current.scale.setScalar(hovered ? 1.1 : 1)
    }
  })

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
              {type === 'sphere' ? (
                <sphereGeometry args={[1, 32, 32]} />
              ) : type === 'cylinder' ? (
                <cylinderGeometry args={[0.8, 0.8, 1.5, 32]} />
              ) : type === 'cone' ? (
                <coneGeometry args={[0.8, 1.5, 32]} />
              ) : type === 'torus' ? (
                <torusGeometry args={[1, 0.3, 16, 32]} />
              ) : (
                <boxGeometry args={[1, 1, 1]} />
              )}
      <meshStandardMaterial 
        color={hovered ? "#ec4899" : "#8b5cf6"} 
        transparent 
        opacity={0.8}
        metalness={0.7}
        roughness={0.3}
      />
    </mesh>
  )
}

// Floating code blocks
function FloatingCodeBlocks() {
          const groupRef = useRef<any>(null)

          useFrame((state: any) => {
    if (groupRef.current) {
              groupRef.current.children.forEach((child: any, index: number) => {
        child.rotation.y = state.clock.elapsedTime * (0.5 + index * 0.1)
        child.position.y = Math.sin(state.clock.elapsedTime + index) * 0.2
      })
    }
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: 6 }).map((_, i) => (
                <mesh
          key={i}
          position={[
            Math.cos(i * Math.PI / 3) * 3,
            Math.sin(i * Math.PI / 3) * 0.5,
            Math.sin(i * Math.PI / 3) * 2
          ]}
        >
                  <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial 
            color={`hsl(${i * 60}, 70%, 60%)`} 
            transparent 
            opacity={0.6}
          />
                </mesh>
      ))}
    </group>
  )
}

// Animated wireframe grid
function WireframeGrid() {
          const meshRef = useRef<any>(null)

          useFrame((state: any) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -2, 0]}>
      <planeGeometry args={[8, 8, 32, 32]} />
      <meshBasicMaterial 
        color="#a855f7" 
        wireframe 
        transparent 
        opacity={0.3}
      />
    </mesh>
  )
}

// Main scene
function ProductScene() {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 0, 8)
  }, [camera])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      
      <ProductModel type="box" />
      <FloatingCodeBlocks />
      <WireframeGrid />
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
                logger.error('Three.js Product Showcase Error', error, {
                  componentStack: errorInfo.componentStack,
                })
              }).catch(() => {
                console.error('Three.js Product Showcase Error:', error, {
                  componentStack: errorInfo.componentStack,
                })
              })
            } catch {
              console.error('Three.js Product Showcase Error:', error, {
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
          ProductScene,
          ErrorBoundary: ThreeJSErrorBoundary
        })
      })
      .catch(async (err) => {
        try {
          const { logger } = await import('@/lib/logger-client')
          logger.error('Failed to load Three.js Product Showcase', err)
        } catch {
          console.error('Failed to load Three.js Product Showcase:', err)
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

  const { Canvas, ProductScene, ErrorBoundary } = ThreeJSComponents

  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-pink-100/10 to-blue-100/20 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-blue-900/30"></div>
      
      <ErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ProductScene />
      </Canvas>
      </ErrorBoundary>
    </div>
  )
}
