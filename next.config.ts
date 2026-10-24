import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    // Owners no longer list directly; the public form is now for room vacancies only.
    return [{ source: "/list-your-property", destination: "/post-a-vacancy", permanent: true }];
  },
};

export default nextConfig;
