import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const isDockerBuild = process.env.DOCKER_BUILD === 'true';
const isCloudflarePages =
  process.env.CF_PAGES === '1' ||
  process.env.CLOUDFLARE_PAGES === '1' ||
  Boolean(process.env.CF_PAGES_BRANCH);
const isVercel = process.env.VERCEL === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Skip lint trong build để tránh lỗi vòng lặp plugin; có thể bật lại bằng NEXT_FORCE_ESLINT=true
    ignoreDuringBuilds:
      process.env.NEXT_FORCE_ESLINT === 'true'
        ? false
        : true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-side modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
      
      // ✅ FIX: Next.js đã tự xử lý React và jsx-runtime
      // Không cần alias React vì có thể gây xung đột với jsx-runtime
      // Chỉ giữ lại fallback cho server-side modules
    }
    
    // Cho phép optional dependencies như firebase-admin được resolve ở runtime
    // Không bundle chúng vào webpack, sẽ load bằng require() khi cần
    if (isServer) {
      const originalExternals = config.externals || [];
      const isFunction = typeof originalExternals === 'function';
      const externalsArray = Array.isArray(originalExternals) ? originalExternals : [];
      
      config.externals = [
        ...externalsArray,
        ({ context, request }, callback) => {
          // firebase-admin là optional dependency, không bắt buộc
          if (request === 'firebase-admin') {
            return callback(null, `commonjs ${request}`);
          }
          // Call original externals function nếu có
          if (isFunction) {
            return originalExternals({ context, request }, callback);
          }
          callback();
        },
      ];
    }
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // ✅ FIX: Cloudflare Pages chưa hỗ trợ Image Optimization của Next.js
    // nên buộc phải unoptimized để dùng CDN của Cloudflare
    unoptimized: isCloudflarePages || process.env.NEXT_IMAGE_UNOPTIMIZED === 'true',
  },
  // ✅ FIX: Next.js tự động expose NEXT_PUBLIC_* variables
  // Chỉ cần config server-side only variables nếu thực sự cần
  // (Thường không cần vì có thể access trực tiếp từ process.env)
  // env: {
  //   // Chỉ thêm nếu cần expose server-side vars cho client (không nên)
  // },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/icons/{{member}}',
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
  // ✅ FIX: Redirects để xử lý các requests không tồn tại
  async rewrites() {
    return [
      // Redirect icon-192.png to logoqtusdev.png
      {
        source: '/icon-192.png',
        destination: '/logoqtusdev.png',
      },
    ]
  },
  // Skip static generation for admin routes
  generateBuildId: async () => {
    if (isCloudflarePages) {
      return process.env.CF_PAGES_COMMIT_SHA?.slice(0, 12) || 'cf-build';
    }
    return 'build-' + Date.now();
  },
  // Disable static optimization for all pages (use dynamic rendering)
  // ✅ FIX: Conditional output - standalone cho Docker, undefined cho Netlify
  // Netlify plugin tự động xử lý Next.js output, không cần standalone
  output: isDockerBuild && !isCloudflarePages ? 'standalone' : undefined,
}

export default nextConfig;