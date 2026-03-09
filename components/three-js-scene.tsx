"use client"

import React, { useRef, useEffect, useState, Component, Suspense } from 'react'

// Canvas component that will be lazy loaded - import Three.js dynamically
export function ThreeJSCanvas() {
  const [ThreeJSComponents, setThreeJSComponents] = useState<{
    Canvas: any
    Scene: any
    ErrorBoundary: any
  } | null>(null)
  const [error, setError] = useState(false)
  const [mounted, setMounted] = useState(false)

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
        const { OrbitControls } = drei
        const THREE = three

        // Floating code symbols particles
        function FloatingCodeParticles({ count = 80 }: { count?: number }) {
          const mesh = useRef<any>(null)
          const temp = useRef<any>(null)
          const colors = useRef<any[]>([])

          useEffect(() => {
            if (!temp.current) {
              temp.current = new THREE.Object3D()
            }
            if (mesh.current && temp.current) {
              const techColors = [
                new THREE.Color('#3b82f6'),
                new THREE.Color('#6366f1'),
                new THREE.Color('#06b6d4'),
                new THREE.Color('#10b981'),
                new THREE.Color('#8b5cf6'),
              ]

              for (let i = 0; i < count; i++) {
                temp.current.position.set(
                  (Math.random() - 0.5) * 25,
                  (Math.random() - 0.5) * 25,
                  (Math.random() - 0.5) * 25
                )
                temp.current.rotation.set(
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                  Math.random() * Math.PI
                )
                const scale = Math.random() * 0.3 + 0.2
                temp.current.scale.setScalar(scale)
                temp.current.updateMatrix()
                mesh.current.setMatrixAt(i, temp.current.matrix)
                
                const color = techColors[Math.floor(Math.random() * techColors.length)]
                colors.current[i] = color
                mesh.current.setColorAt(i, color)
              }
              mesh.current.instanceMatrix.needsUpdate = true
              if (mesh.current.instanceColor) {
                mesh.current.instanceColor.needsUpdate = true
              }
            }
          }, [count])

          useFrame((state: any) => {
            if (mesh.current && mesh.current.count > 0 && temp.current) {
              const instanceCount = mesh.current.count
              for (let i = 0; i < instanceCount; i++) {
                mesh.current.getMatrixAt(i, temp.current.matrix)
                temp.current.rotation.x += 0.008
                temp.current.rotation.y += 0.008
                temp.current.position.y += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002
                temp.current.position.x += Math.cos(state.clock.elapsedTime * 0.3 + i) * 0.001
                temp.current.updateMatrix()
                mesh.current.setMatrixAt(i, temp.current.matrix)
              }
              mesh.current.instanceMatrix.needsUpdate = true
            }
          })

          return (
            <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
              <boxGeometry args={[0.15, 0.15, 0.15]} />
              <meshStandardMaterial transparent opacity={0.6} />
            </instancedMesh>
          )
        }

        // Animated tech shapes
        function AnimatedTechShapes() {
          const groupRef = useRef<any>(null)
          const cubesRef = useRef<any[]>([])

          useFrame((state: any) => {
            if (groupRef.current) {
              groupRef.current.rotation.y = state.clock.elapsedTime * 0.15
              groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
            }

            cubesRef.current.forEach((cube, i) => {
              if (cube) {
                cube.rotation.x += 0.01
                cube.rotation.y += 0.01
                cube.position.y += Math.sin(state.clock.elapsedTime + i) * 0.001
              }
            })
          })

          return (
            <group ref={groupRef}>
              <mesh>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshStandardMaterial 
                  color="#6366f1" 
                  transparent 
                  opacity={0.15}
                  wireframe
                />
              </mesh>
              
              <mesh 
                ref={(el: any) => { if (el) cubesRef.current[0] = el }}
                position={[3.5, 0, 0]}
              >
                <boxGeometry args={[0.6, 0.6, 0.6]} />
                <meshStandardMaterial 
                  color="#3b82f6" 
                  transparent 
                  opacity={0.7} 
                  metalness={0.5}
                  roughness={0.2}
                />
              </mesh>
              
              <mesh 
                ref={(el: any) => { if (el) cubesRef.current[1] = el }}
                position={[-3.5, 0, 0]}
              >
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial 
                  color="#06b6d4" 
                  transparent 
                  opacity={0.7}
                  metalness={0.5}
                  roughness={0.2}
                />
              </mesh>
              
              <mesh 
                ref={(el: any) => { if (el) cubesRef.current[2] = el }}
                position={[0, 3.5, 0]}
              >
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial 
                  color="#10b981" 
                  transparent 
                  opacity={0.7}
                  metalness={0.5}
                  roughness={0.2}
                />
              </mesh>
              
              <mesh 
                ref={(el: any) => { if (el) cubesRef.current[3] = el }}
                position={[0, -3.5, 0]}
              >
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial 
                  color="#8b5cf6" 
                  transparent 
                  opacity={0.7}
                  metalness={0.5}
                  roughness={0.2}
                />
              </mesh>
              
              <mesh position={[0, 0, 0]} rotation={[Math.PI / 4, 0, 0]}>
                <torusGeometry args={[2, 0.2, 16, 32]} />
                <meshStandardMaterial 
                  color="#6366f1" 
                  transparent 
                  opacity={0.4}
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>
              
              <mesh position={[2.5, 2, 1]}>
                <octahedronGeometry args={[0.5]} />
                <meshStandardMaterial 
                  color="#f59e0b" 
                  transparent 
                  opacity={0.6}
                  metalness={0.5}
                  roughness={0.2}
                />
              </mesh>
              
              <mesh position={[-2.5, -2, -1]}>
                <octahedronGeometry args={[0.4]} />
                <meshStandardMaterial 
                  color="#ec4899" 
                  transparent 
                  opacity={0.6}
                  metalness={0.5}
                  roughness={0.2}
                />
              </mesh>

              <mesh position={[2, -1.5, 2]}>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial 
                  color="#14b8a6" 
                  transparent 
                  opacity={0.5}
                  metalness={0.5}
                  roughness={0.2}
                />
              </mesh>
              
              <mesh position={[-2, 1.5, -2]}>
                <boxGeometry args={[0.25, 0.25, 0.25]} />
                <meshStandardMaterial 
                  color="#a855f7" 
                  transparent 
                  opacity={0.5}
                  metalness={0.5}
                  roughness={0.2}
                />
              </mesh>
            </group>
          )
        }

        // Grid plane
        function GridPlane() {
          const gridRef = useRef<any>(null)
          
          useFrame((state: any) => {
            if (gridRef.current) {
              gridRef.current.position.y = -4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2
            }
          })

          return (
            <gridHelper 
              ref={gridRef}
              args={[20, 20, '#3b82f6', '#1e40af']} 
              position={[0, -4, 0]}
            />
          )
        }

        // Main 3D scene
        function Scene() {
          const { camera } = useThree()
          
          useEffect(() => {
            camera.position.set(0, 2, 10)
          }, [camera])

          return (
            <>
              <ambientLight intensity={0.3} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
              <pointLight position={[-10, -10, -10]} intensity={0.6} color="#6366f1" />
              <pointLight position={[0, 10, -10]} intensity={0.4} color="#06b6d4" />
              <spotLight 
                position={[0, 15, 0]} 
                angle={0.3} 
                penumbra={1} 
                intensity={0.5}
                color="#8b5cf6"
              />
              
              <FloatingCodeParticles count={60} />
              <AnimatedTechShapes />
              <GridPlane />
              
              <OrbitControls 
                enableZoom={false} 
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.4}
                maxPolarAngle={Math.PI / 1.8}
                minPolarAngle={Math.PI / 3}
              />
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
                logger.error('Three.js Error', error, {
                  componentStack: errorInfo.componentStack,
                })
              }).catch(() => {
                console.error('Three.js Error:', error, {
                  componentStack: errorInfo.componentStack,
                })
              })
            } catch {
              console.error('Three.js Error:', error, {
                componentStack: errorInfo.componentStack,
              })
            }
          }

          render() {
            if (this.state.hasError) {
              return (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/50 dark:to-indigo-950" />
              )
            }

            return this.props.children
          }
        }

        setThreeJSComponents({
          Canvas,
          Scene,
          ErrorBoundary: ThreeJSErrorBoundary
        })
      })
      .catch(async (err) => {
        try {
          const { logger } = await import('@/lib/logger-client')
          logger.error('Failed to load Three.js', err)
        } catch {
          console.error('Failed to load Three.js:', err)
        }
        setError(true)
      })
      
      return () => clearTimeout(timer)
    }, 100)
  }, [])

  if (!mounted) {
    return null
  }

  if (error) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/50 dark:to-indigo-950" />
    )
  }

  if (!ThreeJSComponents) {
    return null
  }

  const { Canvas, Scene, ErrorBoundary } = ThreeJSComponents

  return (
    <ErrorBoundary>
      <Canvas
        camera={{ position: [0, 2, 10], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
    </ErrorBoundary>
  )
}
