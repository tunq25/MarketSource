'use client';

import React, { useState, useCallback } from 'react';

interface PowCaptchaProps {
  onVerify: (token: string) => void;
  difficulty?: number;
}

export default function PowCaptcha({ onVerify, difficulty = 4 }: PowCaptchaProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const startPoW = useCallback(async () => {
    if (status !== 'idle') return;

    setStatus('processing');
    const timestamp = Date.now();
    const challenge = `market_source_${timestamp}_${Math.random().toString(36).substring(2)}`;
    let nonce = 0;

    const prefix = '0'.repeat(difficulty);

    // Sử dụng requestAnimationFrame để không block UI
    const solveChunk = async (): Promise<void> => {
      const chunkSize = 5000; // Mỗi lần xử lý 5000 nonce
      for (let i = 0; i < chunkSize; i++) {
        const data = challenge + nonce;
        const msgUint8 = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (hash.startsWith(prefix)) {
          const token = btoa(JSON.stringify({ challenge, nonce, hash, timestamp }));
          setStatus('success');
          onVerify(token);
          return;
        }
        nonce++;
      }

      // Yield cho UI thread rồi tiếp tục
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          solveChunk().then(resolve);
        });
      });
    };

    await solveChunk();
  }, [status, difficulty, onVerify]);

  return (
    <div className="flex items-center w-[302px] h-[76px] bg-[#fafafa] dark:bg-[#222222] border border-[#e0e0e0] dark:border-[#555] rounded p-3 select-none shadow-sm">
      <div className="flex items-center w-full">
        {/* Checkbox */}
        <div
          onClick={startPoW}
          className={`w-[28px] h-[28px] border-2 rounded flex items-center justify-center cursor-pointer transition-all duration-200
            ${status === 'success'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
              : status === 'processing'
                ? 'border-blue-400 bg-white dark:bg-[#333]'
                : 'border-[#c1c1c1] dark:border-[#666] bg-white dark:bg-[#333] hover:border-[#999] dark:hover:border-[#888]'
            }`}
          role="button"
          aria-label="Verify you are human"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startPoW(); }}
        >
          {status === 'processing' && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'success' && (
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Label */}
        <div className="ml-3 text-[13px] text-[#555] dark:text-[#ccc] flex-grow font-medium">
          {status === 'processing'
            ? 'Đang xác minh...'
            : status === 'success'
              ? 'Đã xác minh'
              : "I'm not a robot"
          }
        </div>

        {/* Branding */}
        <div className="flex flex-col items-center ml-2">
          <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5">PoW Security</span>
        </div>
      </div>
    </div>
  );
}
