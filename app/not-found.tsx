'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// Animated floating particle
function Particle({ delay, size, x, y, color }: { delay: number; size: number; x: number; y: number; color: string }) {
  return (
    <div
      className="absolute rounded-full opacity-0 animate-particle"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: color,
        animationDelay: `${delay}s`,
        filter: `blur(${size > 6 ? 2 : 0}px)`,
      }}
    />
  );
}

// Glitch text effect
function GlitchText({ text }: { text: string }) {
  return (
    <div className="relative inline-block">
      <span className="glitch-text text-[clamp(6rem,15vw,12rem)] font-black leading-none tracking-tighter" data-text={text}>
        {text}
      </span>
    </div>
  );
}

export default function NotFoundPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 30,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 30,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    size: Math.random() * 8 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: [
      'rgba(147, 51, 234, 0.6)',
      'rgba(236, 72, 153, 0.6)',
      'rgba(59, 130, 246, 0.5)',
      'rgba(168, 85, 247, 0.5)',
      'rgba(34, 211, 238, 0.4)',
    ][Math.floor(Math.random() * 5)],
  }));

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0c0118 0%, #1a0533 25%, #0d1b2a 50%, #1b0a3c 75%, #0c0118 100%)',
      }}
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)',
            top: '-10%',
            left: '-10%',
            animation: 'liquid-float 20s ease-in-out infinite',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
            bottom: '-15%',
            right: '-10%',
            animation: 'liquid-float-reverse 25s ease-in-out infinite',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'liquid-float 15s ease-in-out infinite reverse',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && particles.map((p) => (
          <Particle key={p.id} {...p} />
        ))}
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Main Content */}
      <div
        className={`relative z-10 text-center max-w-2xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{
          transform: mounted ? `perspective(1000px) rotateX(${mousePos.y * 0.05}deg) rotateY(${mousePos.x * 0.05}deg)` : undefined,
        }}
      >
        {/* 404 Number */}
        <div className="relative mb-6">
          <GlitchText text="404" />

          {/* Glow behind number */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ filter: 'blur(40px)', opacity: 0.4 }}
          >
            <span
              className="text-[clamp(6rem,15vw,12rem)] font-black"
              style={{
                background: 'linear-gradient(135deg, #9333ea, #ec4899, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              404
            </span>
          </div>
        </div>

        {/* Glass Card */}
        <div
          className="relative p-8 rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-3xl"
          >
            <div
              className="absolute top-0 -left-full w-full h-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                animation: 'shimmerSlide 4s ease-in-out infinite',
                transform: 'skewX(-20deg)',
              }}
            />
          </div>

          <div className="relative z-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  animation: 'float 6s ease-in-out infinite',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333ea" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                  <path d="M11 8v6" />
                  <path d="M8 11h6" />
                </svg>
              </div>
            </div>

            <h2
              className="text-2xl md:text-3xl font-bold mb-3"
              style={{
                background: 'linear-gradient(135deg, #e2e8f0, #f8fafc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Trang không tồn tại
            </h2>

            <p className="text-gray-400 text-base md:text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Xin lỗi, trang bạn đang tìm kiếm đã bị di chuyển,
              xóa hoặc chưa từng tồn tại.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)]"
                style={{
                  background: 'linear-gradient(135deg, #9333ea, #7c3aed, #6d28d9)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="relative z-10">Về trang chủ</span>
              </Link>

              <button
                onClick={() => window.history.back()}
                className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                <span>Quay lại</span>
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Line */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-purple-500/30" />
          <div className="w-2 h-2 rounded-full bg-purple-500/40" />
          <span className="text-xs text-gray-500 tracking-widest uppercase">MarketSource</span>
          <div className="w-2 h-2 rounded-full bg-pink-500/40" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-pink-500/30" />
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes animate-particle {
          0%,100% { opacity: 0; transform: translateY(0) scale(0); }
          10% { opacity: 1; transform: translateY(0) scale(1); }
          90% { opacity: 0.5; transform: translateY(-100vh) scale(0.5); }
          100% { opacity: 0; transform: translateY(-100vh) scale(0); }
        }
        .animate-particle {
          animation: animate-particle 8s ease-in-out infinite;
        }
        @keyframes shimmerSlide {
          0%, 100% { left: -100%; }
          50% { left: 100%; }
        }
        .glitch-text {
          background: linear-gradient(135deg, #9333ea 0%, #ec4899 40%, #3b82f6 70%, #22d3ee 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #9333ea, #ec4899, #3b82f6, #22d3ee);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
        }
        .glitch-text::before {
          animation: glitch-1 3s ease-in-out infinite;
          clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
        }
        .glitch-text::after {
          animation: glitch-2 3s ease-in-out infinite;
          clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
        }
        @keyframes glitch-1 {
          0%,100% { transform: translate(0); }
          20% { transform: translate(-3px, 3px); }
          40% { transform: translate(3px, -3px); }
          60% { transform: translate(-2px, 1px); }
          80% { transform: translate(2px, -2px); }
        }
        @keyframes glitch-2 {
          0%,100% { transform: translate(0); }
          20% { transform: translate(3px, -3px); }
          40% { transform: translate(-3px, 3px); }
          60% { transform: translate(2px, -1px); }
          80% { transform: translate(-2px, 2px); }
        }
      `}</style>
    </div>
  );
}
