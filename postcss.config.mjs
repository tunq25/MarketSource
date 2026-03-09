/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // ✅ FIX: Tạm thời tắt cssnano vì có thể gây lỗi với Tailwind CSS v3
    // ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
};

export default config;
