"use client"

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Cloud, Sky } from '@react-three/drei'
import * as THREE from 'three'

function MovingClouds() {
    const ref = useRef<THREE.Group>(null)

    useFrame((state, delta) => {
        if (ref.current) {
            // Mây trôi chầm chậm từ phải sang trái
            ref.current.position.x -= delta * 0.5
            // Reset vòng lặp mây
            if (ref.current.position.x < -20) {
                ref.current.position.x = 20
            }
        }
    })

    return (
        <group ref={ref}>
            <Cloud position={[-10, 5, -10]} speed={0.2} opacity={0.6} color="#ffffff" bounds={[10, 2, 2]} volume={15} segments={20} fade={100} />
            <Cloud position={[10, 8, -5]} speed={0.2} opacity={0.5} color="#ffffff" bounds={[10, 2, 2]} volume={15} segments={20} fade={100} />
            <Cloud position={[0, 10, -15]} speed={0.2} opacity={0.7} color="#ffffff" bounds={[10, 2, 2]} volume={20} segments={30} fade={100} />
            <Cloud position={[15, 6, -5]} speed={0.2} opacity={0.4} color="#ffffff" bounds={[10, 2, 2]} volume={10} segments={15} fade={100} />
        </group>
    )
}

export function CloudSky3D() {
    return (
        <div className="absolute inset-0 pointer-events-none z-0 bg-sky-200">
            <Canvas camera={{ position: [0, 0, 20], fov: 60 }} gl={{ alpha: true, antialias: true }}>
                {/* Bầu trời ban ngày */}
                <Sky
                    distance={450000}
                    sunPosition={[0, 1, 0]} // Mặt trời mọc ở đường chân trời
                    inclination={0.6} // Chiều cao mặt trời (chỉnh để bầu trời xanh hơn)
                    azimuth={0.25}
                    turbidity={2} // Giảm độ bụi để trời trong hơn
                    rayleigh={3} // Tăng tán xạ Rayleigh để có màu xanh đậm hơn
                    mieCoefficient={0.005}
                    mieDirectionalG={0.8}
                />
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />

                <MovingClouds />
            </Canvas>
            {/* Lớp mờ để làm nền mượt mà đổ vào trang web, thêm tông xanh dương rõ rệt hơn */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/30 via-sky-300/40 to-white/90" />
        </div>
    )
}
