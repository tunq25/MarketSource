import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

// Sử dụng defineCloudflareConfig để tạo config mặc định
// Nó sẽ tự động tạo structure với default.override đúng cho Cloudflare
const config = defineCloudflareConfig();

// Thêm cloudflare-specific options
config.cloudflare = {
  // Enable workerd build conditions để bundle đúng cho Cloudflare Workers
  useWorkerdCondition: true,
};

export default config;

