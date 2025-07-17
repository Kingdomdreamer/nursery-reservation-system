/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // 実験的な最適化機能
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-bootstrap'],
  },
  
  // バンドルアナライザー（開発時のみ）
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 開発環境でのメモリ最適化
    if (dev) {
      config.cache = false
    }
    
    // プロダクション環境でのバンドルサイズ最適化
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          bootstrap: {
            test: /[\\/]node_modules[\\/](bootstrap|react-bootstrap)[\\/]/,
            name: 'bootstrap',
            priority: 10,
            reuseExistingChunk: true,
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      }
    }
    
    return config
  },
  
  // 画像最適化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // パフォーマンス最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig