/**
 * 最適化された画像コンポーネント
 * Phase 5 - 作業14: パフォーマンス最適化
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { performanceMonitor } from '@/lib/utils/performanceMonitor';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  lazy?: boolean;
  quality?: number;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

interface WebPSupport {
  webp: boolean;
  avif: boolean;
}

// WebP/AVIF サポートの検出
let webpSupport: WebPSupport | null = null;

const detectWebPSupport = async (): Promise<WebPSupport> => {
  if (webpSupport) return webpSupport;

  const testWebP = () => {
    return new Promise<boolean>((resolve) => {
      const webpData = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==';
      const img = new Image();
      img.onload = img.onerror = () => resolve(img.height === 2);
      img.src = webpData;
    });
  };

  const testAVIF = () => {
    return new Promise<boolean>((resolve) => {
      const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
      const img = new Image();
      img.onload = img.onerror = () => resolve(img.height === 1);
      img.src = avifData;
    });
  };

  const [webp, avif] = await Promise.all([testWebP(), testAVIF()]);
  
  webpSupport = { webp, avif };
  return webpSupport;
};

// 画像の最適化されたソースを生成
const generateOptimizedSrc = (
  originalSrc: string,
  width?: number,
  height?: number,
  quality: number = 80,
  format?: string
): string => {
  // Next.js Image Optimization API を使用する場合
  if (originalSrc.startsWith('/') && !originalSrc.startsWith('//')) {
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    if (format) params.set('f', format);

    return `/_next/image?url=${encodeURIComponent(originalSrc)}&${params.toString()}`;
  }

  // 外部画像の場合はそのまま返す
  return originalSrc;
};

// レスポンシブな画像サイズの生成
const generateSizes = (width?: number): string => {
  if (width) {
    return `(max-width: 640px) ${Math.min(width, 640)}px, (max-width: 1024px) ${Math.min(width, 1024)}px, ${width}px`;
  }
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  lazy = true,
  quality = 80,
  sizes,
  priority = false,
  onLoad,
  onError,
  fallbackSrc
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [inView, setInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer による遅延読み込み
  useEffect(() => {
    if (!lazy || priority || inView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority, inView]);

  // 最適化された画像ソースの生成
  useEffect(() => {
    if (!inView) return;

    const generateSrc = async () => {
      const measureName = performanceMonitor.startMeasure('image_src_generation', { src, width, height });
      
      try {
        const support = await detectWebPSupport();
        
        let format: string | undefined;
        if (support.avif) {
          format = 'avif';
        } else if (support.webp) {
          format = 'webp';
        }

        const optimizedSrc = generateOptimizedSrc(src, width, height, quality, format);
        setCurrentSrc(optimizedSrc);

      } catch (error) {
        console.warn('[OptimizedImage] Format detection failed, using original src:', error);
        setCurrentSrc(src);
      } finally {
        performanceMonitor.endMeasure(measureName);
      }
    };

    generateSrc();
  }, [src, width, height, quality, inView]);

  // 画像読み込み処理
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsError(false);
    } else {
      onError?.();
    }
  };

  // プレースホルダーの生成
  const generatePlaceholder = () => {
    if (placeholder) return placeholder;
    
    // データURLによるプレースホルダー生成
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width || 300;
    canvas.height = height || 200;
    
    if (ctx) {
      // グラデーション背景
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      return canvas.toDataURL();
    }
    
    return '';
  };

  // Loading skeleton
  if (!inView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{
          width: width || '100%',
          height: height || 'auto',
          aspectRatio: width && height ? `${width}/${height}` : undefined
        }}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* プレースホルダー画像 */}
      {!isLoaded && !isError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{
            backgroundImage: placeholder ? `url(${generatePlaceholder()})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!placeholder && (
            <div className="text-gray-400 text-sm">Loading...</div>
          )}
        </div>
      )}

      {/* メイン画像 */}
      {currentSrc && !isError && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes || generateSizes(width)}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`
            transition-opacity duration-300 
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          style={{
            aspectRatio: width && height ? `${width}/${height}` : undefined
          }}
        />
      )}

      {/* エラー時のフォールバック */}
      {isError && (
        <div
          className="flex items-center justify-center bg-gray-100 text-gray-400 text-sm"
          style={{
            width: width || '100%',
            height: height || 200,
            aspectRatio: width && height ? `${width}/${height}` : undefined
          }}
        >
          画像を読み込めませんでした
        </div>
      )}
    </div>
  );
};

// プリロード機能
export const preloadImage = (src: string, crossOrigin?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    
    link.onload = () => resolve();
    link.onerror = reject;
    
    document.head.appendChild(link);
  });
};

// 複数画像の一括プリロード
export const preloadImages = async (srcList: string[]): Promise<void> => {
  const measureName = performanceMonitor.startMeasure('bulk_image_preload', { count: srcList.length });
  
  try {
    await Promise.all(srcList.map(src => preloadImage(src)));
  } finally {
    performanceMonitor.endMeasure(measureName);
  }
};

// 画像の最適化設定
export const ImageOptimizationConfig = {
  // 品質設定
  quality: {
    high: 90,
    medium: 80,
    low: 60
  },
  
  // フォーマット優先順位
  formatPriority: ['avif', 'webp', 'jpeg', 'png'],
  
  // レスポンシブブレイクポイント
  breakpoints: [640, 768, 1024, 1280, 1536],
  
  // 遅延読み込み設定
  lazyLoading: {
    rootMargin: '50px',
    threshold: 0.1
  }
};