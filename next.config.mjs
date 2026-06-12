/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: '10mb', // مقدار مورد نظر خود را اینجا بنویسید
    },
  },
  typescript: {
    // نادیده گرفتن خطاهای تایپ‌اسکریپت برای انجام بیلد
    ignoreBuildErrors: true,
  },
  eslint: {
    // نادیده گرفتن خطاهای لیتینگ
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
