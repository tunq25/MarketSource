"use client"

import { useRef, useEffect, useState, Component } from 'react'

// Main component - import Three.js dynamically in runtime
export function ThreeJSAdmin() {
  const [mounted, setMounted] = useState(false)
  const [ThreeJSComponents, setThreeJSComponents] = useState<{
    Canvas: any
    AdminScene: any
    ErrorBoundary: any
  } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    // ✅ FIX: Đảm bảo React context đã sẵn sàng trước khi load Three.js
    setMounted(true)
    
    // Delay nhỏ để đảm bảo React context hoàn toàn sẵn sàng
    const timer = setTimeout(() => {
    // Dynamic import trong runtime, không phải trong module evaluation
    Promise.all([
      import('@react-three/fiber'),
      import('@react-three/drei'),
      import('three')
    ])
      .then(([fiber, drei, three]) => {
        const { Canvas, useFrame, useThree } = fiber
        const THREE = three

        // Data visualization cubes
        function DataCubes() {
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
              <mesh position={[-3, 0, 0]}>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial color="#3b82f6" transparent opacity={0.7} />
              </mesh>
              
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
                <meshStandardMaterial color="#10b981" transparent opacity={0.7} />
              </mesh>
              
              <mesh position={[3, 0, 0]}>
                <boxGeometry args={[0.7, 0.7, 0.7]} />
                <meshStandardMaterial color="#f59e0b" transparent opacity={0.7} />
              </mesh>
            </group>
          )
        }

        // Floating admin icons
        function AdminIcons() {
          const groupRef = useRef<any>(null)

          useFrame((state: any) => {
            if (groupRef.current) {
              groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
            }
          })

          return (
            <group ref={groupRef}>
              <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 8]} />
                <meshStandardMaterial color="#ef4444" transparent opacity={0.8} />
              </mesh>
              
              <mesh position={[0, -2, 0]}>
                <torusGeometry args={[0.5, 0.1, 8, 16]} />
                <meshStandardMaterial color="#8b5cf6" transparent opacity={0.8} />
              </mesh>
              
              <mesh position={[2, 0, 0]}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color="#06b6d4" transparent opacity={0.6} />
              </mesh>
              
              <mesh position={[-2, 0, 0]}>
                <coneGeometry args={[0.3, 0.8, 8]} />
                <meshStandardMaterial color="#f97316" transparent opacity={0.8} />
              </mesh>
            </group>
          )
        }

        // Network visualization
        function NetworkVisualization() {
          const points = useRef<any>(null)
          const lines = useRef<any>(null)

          useEffect(() => {
            // THREE is available in closure, no need to add to dependencies
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const nodePositions = new Float32Array(15 * 3)
            for (let i = 0; i < 15; i++) {
              nodePositions[i * 3] = (Math.random() - 0.5) * 10
              nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 10
              nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 10
            }

            const linePositions = new Float32Array(30 * 3)
            for (let i = 0; i < 15; i++) {
              const targetIndex = Math.floor(Math.random() * 15)
              if (targetIndex !== i) {
                linePositions[i * 6] = nodePositions[i * 3]
                linePositions[i * 6 + 1] = nodePositions[i * 3 + 1]
                linePositions[i * 6 + 2] = nodePositions[i * 3 + 2]
                linePositions[i * 6 + 3] = nodePositions[targetIndex * 3]
                linePositions[i * 6 + 4] = nodePositions[targetIndex * 3 + 1]
                linePositions[i * 6 + 5] = nodePositions[targetIndex * 3 + 2]
              }
            }

            if (points.current) {
              points.current.geometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
              points.current.geometry.attributes.position.needsUpdate = true
            }
            if (lines.current) {
              lines.current.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
              lines.current.geometry.attributes.position.needsUpdate = true
            }
          }, [])

          useFrame((state: any) => {
            if (points.current) {
              points.current.rotation.y = state.clock.elapsedTime * 0.1
            }
            if (lines.current) {
              lines.current.rotation.y = state.clock.elapsedTime * 0.1
            }
          })

          return (
            <group>
              <points ref={points}>
                <bufferGeometry />
                <pointsMaterial size={0.1} color="#a855f7" transparent opacity={0.6} />
              </points>
              <lineSegments ref={lines}>
                <bufferGeometry />
                <lineBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
              </lineSegments>
            </group>
          )
        }

        // Main scene
        function AdminScene() {
          const { camera } = useThree()
          
          useEffect(() => {
            camera.position.set(0, 0, 8)
          }, [camera])

          return (
            <>
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
              
              <DataCubes />
              <AdminIcons />
              <NetworkVisualization />
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
                logger.error('Three.js Admin Error', error, {
                  componentStack: errorInfo.componentStack,
                })
              }).catch(() => {
                console.error('Three.js Admin Error:', error, {
                  componentStack: errorInfo.componentStack,
                })
              })
            } catch {
            console.error('Three.js Admin Error:', error, {
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
          AdminScene,
          ErrorBoundary: ThreeJSErrorBoundary
        })
      })
      .catch(async (err) => {
        try {
          const { logger } = await import('@/lib/logger-client')
          logger.error('Failed to load Three.js Admin', err)
        } catch {
        console.error('Failed to load Three.js Admin:', err)
        }
        setError(true)
      })
      
      return () => clearTimeout(timer)
    }, 100)
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

  const { Canvas, AdminScene, ErrorBoundary } = ThreeJSComponents

  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-pink-100/10 to-blue-100/20 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-blue-900/30"></div>
      
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 75 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
        >
          <AdminScene />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
