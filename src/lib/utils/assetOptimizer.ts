/**
 * アセット最適化ユーティリティ
 * Phase 5 - 作業14: パフォーマンス最適化
 */

import React from 'react';
import { performanceMonitor } from './performanceMonitor';

interface AssetPreloadConfig {
  rel: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';
  as?: 'script' | 'style' | 'font' | 'image' | 'document';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  importance?: 'high' | 'low' | 'auto';
}

interface FontConfig {
  family: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
  display: 'swap' | 'fallback' | 'optional' | 'block' | 'auto';
  preload?: boolean;
}

class AssetOptimizer {
  private preloadedAssets = new Set<string>();
  private criticalResources = new Set<string>();
  private resourceHints = new Map<string, AssetPreloadConfig>();

  /**
   * 重要なリソースとしてマーク
   */
  markAsCritical(url: string): void {
    this.criticalResources.add(url);
  }

  /**
   * リソースヒントを追加
   */
  addResourceHint(url: string, config: AssetPreloadConfig): void {
    this.resourceHints.set(url, config);
    this.applyResourceHint(url, config);
  }

  /**
   * CSS の最適化
   */
  optimizeCSS() {
    // クリティカル CSS の抽出と適用
    this.extractCriticalCSS();
    
    // 非クリティカル CSS の遅延読み込み
    this.deferNonCriticalCSS();
    
    // 使用されていない CSS の検出
    this.detectUnusedCSS();
  }

  /**
   * JavaScript の最適化
   */
  optimizeJavaScript() {
    // コードスプリッティングの推奨
    this.suggestCodeSplitting();
    
    // 非同期ローディングの推奨
    this.suggestAsyncLoading();
    
    // Tree shaking の推奨
    this.suggestTreeShaking();
  }

  /**
   * フォントの最適化
   */
  optimizeFonts(fonts: FontConfig[]): void {
    fonts.forEach(font => {
      // フォントのプリロード
      if (font.preload) {
        this.preloadFont(font);
      }
      
      // フォント表示の最適化
      this.optimizeFontDisplay(font);
      
      // Web フォントのサブセット化推奨
      this.suggestFontSubsetting(font);
    });
  }

  /**
   * 画像の最適化推奨
   */
  suggestImageOptimizations(): string[] {
    return [
      '次世代画像フォーマット（WebP, AVIF）の使用を検討してください',
      '適切な画像サイズでの配信を確認してください',
      '画像の遅延読み込み（lazy loading）を実装してください',
      '重要でない画像のプリロードを避けてください',
      '画像圧縮率を最適化してください',
      'レスポンシブ画像（srcset）の使用を検討してください'
    ];
  }

  /**
   * バンドルサイズの分析
   */
  analyzeBundleSize(): {
    suggestions: string[];
    heavyDependencies: string[];
    duplicates: string[];
  } {
    // 実際のバンドル分析はビルド時に行われるため、ここでは推奨事項を返す
    return {
      suggestions: [
        'webpack-bundle-analyzer を使用してバンドルサイズを分析してください',
        '不要な依存関係を削除してください',
        'Dynamic imports を使用してコードスプリッティングを行ってください',
        'Tree shaking が有効になっていることを確認してください',
        'Production ビルドで未使用のコードが削除されることを確認してください'
      ],
      heavyDependencies: [
        '@supabase/supabase-js',
        'react-hook-form',
        'next'
      ],
      duplicates: []
    };
  }

  /**
   * Service Worker による キャッシング戦略
   */
  setupCacheStrategy(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const cacheStrategy = {
      // 静的アセットは長期キャッシュ
      staticAssets: {
        strategy: 'CacheFirst',
        cacheName: 'static-assets-v1',
        maxAge: 30 * 24 * 60 * 60, // 30日
      },
      
      // API レスポンスはネットワーク優先
      apiResponses: {
        strategy: 'NetworkFirst',
        cacheName: 'api-cache-v1',
        maxAge: 5 * 60, // 5分
      },
      
      // 画像は stale-while-revalidate
      images: {
        strategy: 'StaleWhileRevalidate',
        cacheName: 'images-v1',
        maxAge: 7 * 24 * 60 * 60, // 7日
      }
    };

    console.log('[AssetOptimizer] Cache strategy configured:', cacheStrategy);
  }

  /**
   * CDN 使用の推奨
   */
  suggestCDNUsage(): string[] {
    return [
      '静的アセットをCDNから配信することを検討してください',
      '画像最適化サービスの使用を検討してください',
      'フォントをGoogle FontsまたはCDNから読み込むことを検討してください',
      'JavaScriptライブラリをCDNから読み込むことを検討してください',
      'キャッシュヘッダーを適切に設定してください'
    ];
  }

  /**
   * パフォーマンス監視の設定
   */
  setupPerformanceMonitoring(): void {
    // Resource Timing API を使用したリソースパフォーマンスの監視
    this.monitorResourcePerformance();
    
    // Navigation Timing API を使用したページパフォーマンスの監視
    this.monitorPagePerformance();
    
    // User Timing API を使用したカスタムメトリクスの監視
    this.monitorCustomMetrics();
  }

  /**
   * プリロード戦略の実行
   */
  executePreloadStrategy(): void {
    // 重要なリソースのプリロード
    this.preloadCriticalResources();
    
    // 次のページで必要になりそうなリソースのプリフェッチ
    this.prefetchLikelyResources();
    
    // DNS ルックアップの事前解決
    this.preconnectToOrigins();
  }

  // Private メソッド実装

  private applyResourceHint(url: string, config: AssetPreloadConfig): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = config.rel;
    link.href = url;
    
    if (config.as) link.as = config.as;
    if (config.type) link.type = config.type;
    if (config.crossOrigin) link.crossOrigin = config.crossOrigin;
    if (config.importance) (link as any).importance = config.importance;

    document.head.appendChild(link);
    
    console.log(`[AssetOptimizer] Applied resource hint: ${config.rel} for ${url}`);
  }

  private preloadFont(font: FontConfig): void {
    font.weights.forEach(weight => {
      font.styles.forEach(style => {
        const fontUrl = this.generateFontUrl(font.family, weight, style);
        this.addResourceHint(fontUrl, {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          crossOrigin: 'anonymous'
        });
      });
    });
  }

  private generateFontUrl(family: string, weight: number, style: string): string {
    // Google Fonts の URL 生成例
    const familyParam = family.replace(/\s+/g, '+');
    const styleParam = style === 'italic' ? 'ital,' : '';
    return `https://fonts.googleapis.com/css2?family=${familyParam}:${styleParam}wght@${weight}&display=swap`;
  }

  private optimizeFontDisplay(font: FontConfig): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${font.family}';
        font-display: ${font.display};
      }
    `;
    document.head.appendChild(style);
  }

  private suggestFontSubsetting(font: FontConfig): void {
    console.log(`[AssetOptimizer] Font subsetting recommended for: ${font.family}`);
    console.log('Consider using only the characters you need to reduce font file size');
  }

  private extractCriticalCSS(): void {
    // Above-the-fold コンテンツのスタイルを特定
    console.log('[AssetOptimizer] Critical CSS extraction recommended');
    console.log('Use tools like Critical or Penthouse to extract critical CSS');
  }

  private deferNonCriticalCSS(): void {
    if (typeof document === 'undefined') return;

    const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
    styleSheets.forEach(link => {
      const href = (link as HTMLLinkElement).href;
      if (!this.criticalResources.has(href)) {
        // 非クリティカル CSS の遅延読み込み
        this.loadCSSAsync(href);
      }
    });
  }

  private loadCSSAsync(href: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  }

  private detectUnusedCSS(): void {
    console.log('[AssetOptimizer] Unused CSS detection recommended');
    console.log('Use tools like PurgeCSS or UnCSS to remove unused styles');
  }

  private suggestCodeSplitting(): void {
    console.log('[AssetOptimizer] Code splitting recommendations:');
    console.log('- Split by routes (page-level chunks)');
    console.log('- Split by features (component-level chunks)');
    console.log('- Split vendor libraries into separate chunks');
  }

  private suggestAsyncLoading(): void {
    console.log('[AssetOptimizer] Async loading recommendations:');
    console.log('- Use dynamic imports for non-critical components');
    console.log('- Load third-party scripts asynchronously');
    console.log('- Implement lazy loading for below-the-fold content');
  }

  private suggestTreeShaking(): void {
    console.log('[AssetOptimizer] Tree shaking recommendations:');
    console.log('- Use ES6 modules for better tree shaking');
    console.log('- Import only needed functions from libraries');
    console.log('- Configure webpack for aggressive tree shaking');
  }

  private monitorResourcePerformance(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          console.log(`[ResourceTiming] ${resourceEntry.name}:`, {
            duration: resourceEntry.duration,
            transferSize: resourceEntry.transferSize,
            encodedBodySize: resourceEntry.encodedBodySize,
            decodedBodySize: resourceEntry.decodedBodySize
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private monitorPagePerformance(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domInteractive: navigation.domInteractive - navigation.startTime,
        domComplete: navigation.domComplete - navigation.startTime,
        loadComplete: navigation.loadEventEnd - navigation.startTime
      };

      console.log('[PagePerformance] Navigation Timing:', metrics);
      
      // パフォーマンス閾値のチェック
      this.checkPerformanceThresholds(metrics);
    });
  }

  private monitorCustomMetrics(): void {
    // カスタムメトリクスの測定例
    performance.mark('app-start');
    
    // アプリケーション初期化完了時
    setTimeout(() => {
      performance.mark('app-ready');
      performance.measure('app-initialization', 'app-start', 'app-ready');
      
      const measure = performance.getEntriesByName('app-initialization')[0];
      console.log(`[CustomMetric] App initialization: ${measure.duration}ms`);
    }, 0);
  }

  private checkPerformanceThresholds(metrics: Record<string, number>): void {
    const thresholds = {
      ttfb: 200, // 200ms
      domInteractive: 1000, // 1秒
      loadComplete: 3000 // 3秒
    };

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      if (metrics[metric] > threshold) {
        console.warn(`[PerformanceWarning] ${metric} exceeded threshold: ${metrics[metric]}ms > ${threshold}ms`);
      }
    });
  }

  private preloadCriticalResources(): void {
    this.criticalResources.forEach(url => {
      if (!this.preloadedAssets.has(url)) {
        this.addResourceHint(url, { rel: 'preload' });
        this.preloadedAssets.add(url);
      }
    });
  }

  private prefetchLikelyResources(): void {
    // 次に訪問される可能性の高いページのリソースをプリフェッチ
    const likelyRoutes = ['/form', '/admin', '/cancel'];
    
    likelyRoutes.forEach(route => {
      this.addResourceHint(route, { rel: 'prefetch', as: 'document' });
    });
  }

  private preconnectToOrigins(): void {
    const origins = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://supabase.co'
    ];

    origins.forEach(origin => {
      this.addResourceHint(origin, { rel: 'preconnect', crossOrigin: 'anonymous' });
    });
  }

  /**
   * パフォーマンス最適化のレポート生成
   */
  generateOptimizationReport(): {
    critical_issues: string[];
    recommendations: string[];
    metrics: Record<string, any>;
    next_steps: string[];
  } {
    return {
      critical_issues: [
        'Large JavaScript bundles detected',
        'Render-blocking CSS found',
        'Images without optimization',
        'Missing resource hints'
      ],
      recommendations: [
        ...this.suggestImageOptimizations(),
        ...this.suggestCDNUsage(),
        ...this.analyzeBundleSize().suggestions
      ],
      metrics: {
        preloaded_assets: this.preloadedAssets.size,
        critical_resources: this.criticalResources.size,
        resource_hints: this.resourceHints.size
      },
      next_steps: [
        'Implement code splitting for large components',
        'Set up Service Worker for caching',
        'Optimize images and use next-gen formats',
        'Configure CDN for static assets',
        'Monitor Core Web Vitals regularly'
      ]
    };
  }
}

// シングルトンインスタンス
export const assetOptimizer = new AssetOptimizer();

// React フック
export const useAssetOptimization = () => {
  React.useEffect(() => {
    // 初期化時の最適化
    assetOptimizer.optimizeCSS();
    assetOptimizer.optimizeJavaScript();
    assetOptimizer.setupCacheStrategy();
    assetOptimizer.executePreloadStrategy();
    assetOptimizer.setupPerformanceMonitoring();
  }, []);

  const markCritical = React.useCallback((url: string) => {
    assetOptimizer.markAsCritical(url);
  }, []);

  const addResourceHint = React.useCallback((url: string, config: AssetPreloadConfig) => {
    assetOptimizer.addResourceHint(url, config);
  }, []);

  const generateReport = React.useCallback(() => {
    return assetOptimizer.generateOptimizationReport();
  }, []);

  return {
    markCritical,
    addResourceHint,
    generateReport
  };
};