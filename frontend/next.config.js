/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Environment-specific configuration
  ...(() => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isStaging = process.env.VERCEL_ENV === 'preview' || process.env.STAGING === 'true';

    // Production build for AWS ECS deployment (server mode)
    if (isProduction && !isStaging) {
      return {
        output: 'standalone', // Standalone server for ECS containers
        experimental: {
          outputFileTracingRoot: path.join(__dirname, '../'),
        },
        // Production API calls go through CloudFront to ALB
        env: {
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
        }
      };
    }

    // Development configuration with API proxying
    return {
      // Proxy /api calls to Express backend in development
      async rewrites() {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        console.log('🔧 Next.js API proxy configured:', backendUrl);
        
        return [
          {
            source: '/api/:path*',
            destination: `${backendUrl}/api/:path*`,
          },
          {
            source: '/images/:path*',
            destination: `${backendUrl}/images/:path*`,
          },
        ];
      },
      env: {
        NEXT_PUBLIC_API_URL: '', // Empty in dev - use relative paths
      }
    };
  })(),

  // Common configuration
  // Note: serverExternalPackages is Next.js 15+ only, removed for v14 compatibility
  
  // Development settings
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Enhanced image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com; img-src 'self' data: https:; sandbox;",
  },
  
  // Remove console logs in production and enable SWC optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // SWC optimizations for smaller bundles
    styledComponents: false, // We use Tailwind, disable styled-components
  },

  // Bundle optimization - enable experimental features for all environments
  experimental: {
    scrollRestoration: true,
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Reduce bundle size by aliasing server-only packages to empty modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // Bundle analyzer for development (only load plugin when needed)
    if (process.env.ANALYZE === 'true') {
      try {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-analyzer-report.html',
          })
        );
      } catch (error) {
        console.warn('webpack-bundle-analyzer not available:', error.message);
      }
    }

    return config;
  },

  // Security headers for production
  async headers() {
    if (process.env.NODE_ENV !== 'production') return [];
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
