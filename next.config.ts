import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint設定
  eslint: {
    // Allow production builds to complete even with ESLint errors/warnings
    ignoreDuringBuilds: true,
  },
  
  // TypeScript設定
  typescript: {
    // Allow production builds to complete even with TypeScript errors (already working)
    ignoreBuildErrors: false,
  },

  // パフォーマンス最適化設定
  compiler: {
    // 本番環境で console.log を削除
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 画像最適化設定
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // バンドル最適化
  webpack: (config, { dev, isServer }) => {
    // バンドル分析（環境変数で制御）
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
        })
      );
    }

    // 本番環境での最適化
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 15,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }

    return config;
  },

  // セキュリティ・パフォーマンスヘッダー
  async headers() {
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
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 圧縮設定
  compress: true,

  // ライブラリの最適化インポート
  modularizeImports: {
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
};

export default nextConfig;
