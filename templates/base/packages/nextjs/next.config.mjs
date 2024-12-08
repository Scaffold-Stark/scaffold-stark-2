/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // make sure no one injects anything funny in svg
    dangerouslyAllowSVG: true,
    remotePatterns: [
      // we might need to add more links. this is just from the starknet ID identicon
      {
        protocol: "https",
        hostname: "identicon.starknet.id",
        pathname: "/**", // Allows all paths under this domain
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
