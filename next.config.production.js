/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for S3 deployment
  output: 'export',
  
  // Disable server-side features for static deployment
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  // Image optimization settings for static export
  images: {
    unoptimized: true,
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.js'
  },
  
  // Asset prefix for CloudFront
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://app.trustdiner.com' : '',
  
  // Base path configuration
  basePath: '',
  
  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://vh68e62bb8.execute-api.eu-west-2.amazonaws.com https://maps.googleapis.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  },
  
  // Environment variables for build
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://vh68e62bb8.execute-api.eu-west-2.amazonaws.com/prod',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_ENV: 'production',
    NEXT_PUBLIC_VERSION: process.env.npm_package_version || '2.0.0'
  },
  
  // Webpack configuration for optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Bundle analyzer (optional)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-analysis.html',
          openAnalyzer: false
        })
      );
    }
    
    return config;
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

module.exports = nextConfig;