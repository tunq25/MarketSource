'use client';

import React, { useEffect, useState } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Animated circuit lines
function CircuitLine({ d, delay }: { d: string; delay: number }) {
  return (
    <path
      d={d}
      stroke="url(#circuitGrad)"
      strokeWidth="1"
      fill="none"
      strokeDasharray="8 4"
      opacity="0.3"
      style={{
        animation: `dashMove 3s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    setMounted(true);
    console.error('App Error:', error);
  }, [error]);

  useEffect(() => {
    if (countdown <= 0) {
      reset();
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, reset]);

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0f0c1a 0%, #1c0a2e 30%, #0d1520 60%, #180e30 100%)',
      }}
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
            top: '-5%',
            right: '-5%',
            animation: 'liquid-float 18s ease-in-out infinite',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
            bottom: '-10%',
            left: '-5%',
            animation: 'liquid-float-reverse 22s ease-in-out infinite',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)',
            top: '40%',
            left: '30%',
            animation: 'liquid-float 15s ease-in-out infinite reverse',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Circuit Board SVG Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <CircuitLine d="M0,100 H200 V250 H400" delay={0} />
        <CircuitLine d="M800,50 H600 V180 H400 V300" delay={0.5} />
        <CircuitLine d="M100,400 H350 V300 H500" delay={1} />
        <CircuitLine d="M900,350 H700 V200 H550" delay={1.5} />
        <CircuitLine d="M0,500 H150 V350 H300" delay={2} />
      </svg>

      {/* Main Content */}
      <div
        className={`relative z-10 text-center max-w-xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Error Icon Animation */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Pulsing ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2), transparent 70%)',
                animation: 'pulseRing 2s ease-out infinite',
                width: '120px',
                height: '120px',
                top: '-20px',
                left: '-20px',
              }}
            />

            <div
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                animation: 'float 5s ease-in-out infinite',
              }}
            >
              {/* Alert Triangle Icon */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="errorIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke="url(#errorIconGrad)" />
                <path d="M12 9v4" stroke="url(#errorIconGrad)" />
                <path d="M12 17h.01" stroke="url(#errorIconGrad)" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Title */}
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{
            background: 'linear-gradient(135deg, #f87171, #fbbf24, #f87171)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradient-shift 4s ease infinite',
          }}
        >
          Có lỗi xảy ra!
        </h1>

        <p className="text-gray-400 text-base md:text-lg mb-2">
          Hệ thống gặp sự cố không mong muốn.
        </p>

        {/* Error Detail Card */}
        <div
          className="relative mt-6 p-5 rounded-2xl text-left overflow-hidden"
          style={{
            background: 'rgba(239, 68, 68, 0.03)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(239, 68, 68, 0.1)',
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-400/80 uppercase tracking-wider">Error Details</span>
            </div>
            <p className="text-sm font-mono text-gray-400 break-all leading-relaxed">
              {error.message || 'Một lỗi không xác định đã xảy ra'}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs font-mono text-gray-500">
                ID: <span className="text-purple-400/60">{error.digest}</span>
              </p>
            )}
          </div>
        </div>

        {/* Auto-retry countdown */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
              <circle
                cx="16" cy="16" r="14"
                fill="none"
                stroke="url(#countdownGrad)"
                strokeWidth="2"
                strokeDasharray={`${(countdown / 30) * 88} 88`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s linear' }}
              />
              <defs>
                <linearGradient id="countdownGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9333ea" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-400">
              {countdown}
            </span>
          </div>
          <span className="text-xs text-gray-500">Tự động thử lại</span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={reset}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #ea580c)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-180 transition-transform duration-500">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            <span className="relative z-10">Thử lại</span>
          </button>

          <a
            href="/"
            className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e2e8f0',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Về trang chủ</span>
          </a>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-red-500/20" />
          <div className="w-2 h-2 rounded-full bg-red-500/30 animate-pulse" />
          <span className="text-xs text-gray-600 tracking-widest uppercase">System Error</span>
          <div className="w-2 h-2 rounded-full bg-orange-500/30 animate-pulse" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-orange-500/20" />
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes dashMove {
          to { stroke-dashoffset: -24; }
        }
      `}</style>
    </div>
  );
}
