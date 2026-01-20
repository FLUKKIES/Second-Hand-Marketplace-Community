import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      // ใส่โดเมน Ngrok ของคุณลงไป (ต้องคอยแก้ทุกครั้งที่ได้ url ใหม่)
      allowedOrigins: ["undefrauded-palindromically-jone.ngrok-free.dev"],
    },
  },
};

export default nextConfig;
