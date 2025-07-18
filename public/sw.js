// Service Worker for PWA functionality
// ベジライス予約システム - プログレッシブWebアプリケーション

const CACHE_NAME = 'vegirice-v1.0.0'
const STATIC_CACHE_NAME = 'vegirice-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'vegirice-dynamic-v1.0.0'

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-144x144.png',
  '/icons/icon-128x128.png',
  '/icons/icon-96x96.png',
  '/icons/icon-72x72.png',
  // Bootstrap CSS
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  // Bootstrap Icons
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css'
]

// 動的キャッシュの対象となるURLパターン
const DYNAMIC_CACHE_PATTERNS = [
  /^\/api\//,
  /^\/admin\//,
  /^\/form\//,
  /^\/.*\.(png|jpg|jpeg|gif|webp|svg)$/,
  /^\/.*\.(js|css|woff2?)$/
]

// オフライン時に表示するページ
const OFFLINE_FALLBACK_PAGE = '/offline.html'

// Service Worker のインストール
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Installed successfully')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

// Service Worker のアクティベーション
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // 古いキャッシュを削除
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated successfully')
        return self.clients.claim()
      })
      .catch(error => {
        console.error('Service Worker: Activation failed', error)
      })
  )
})

// ネットワークリクエストの処理
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // POST リクエストは処理しない
  if (request.method !== 'GET') {
    return
  }
  
  // 外部リソースの処理
  if (url.origin !== location.origin) {
    event.respondWith(handleExternalRequest(request))
    return
  }
  
  // 静的リソースの処理
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request))
    return
  }
  
  // 動的リソースの処理
  if (isDynamicAsset(url.pathname)) {
    event.respondWith(handleDynamicRequest(request))
    return
  }
  
  // ページリクエストの処理
  event.respondWith(handlePageRequest(request))
})

// 静的リソースの処理
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Static request failed:', error)
    return new Response('Network error', { status: 408 })
  }
}

// 動的リソースの処理
async function handleDynamicRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    
    // ネットワークファーストで試行
    try {
      const networkResponse = await fetch(request)
      
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      
      return networkResponse
    } catch (networkError) {
      // ネットワークエラーの場合はキャッシュから取得
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        return cachedResponse
      }
      
      throw networkError
    }
  } catch (error) {
    console.error('Dynamic request failed:', error)
    return new Response('Resource not available offline', { status: 503 })
  }
}

// ページリクエストの処理
async function handlePageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    
    // ネットワークファーストで試行
    try {
      const networkResponse = await fetch(request)
      
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      
      return networkResponse
    } catch (networkError) {
      // ネットワークエラーの場合はキャッシュから取得
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        return cachedResponse
      }
      
      // オフラインページを表示
      const offlineResponse = await cache.match(OFFLINE_FALLBACK_PAGE)
      return offlineResponse || new Response('Page not available offline', { status: 503 })
    }
  } catch (error) {
    console.error('Page request failed:', error)
    return new Response('Page not available', { status: 503 })
  }
}

// 外部リソースの処理
async function handleExternalRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('External request failed:', error)
    return new Response('External resource not available', { status: 503 })
  }
}

// 静的リソースの判定
function isStaticAsset(pathname) {
  return STATIC_ASSETS.some(asset => pathname === asset) ||
         pathname.startsWith('/_next/static/') ||
         pathname.startsWith('/icons/') ||
         pathname.includes('bootstrap') ||
         pathname.includes('.css') ||
         pathname.includes('.js') ||
         pathname.includes('.woff')
}

// 動的リソースの判定
function isDynamicAsset(pathname) {
  return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(pathname))
}

// バックグラウンド同期
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// バックグラウンド同期の実行
async function doBackgroundSync() {
  try {
    // オフライン時に蓄積されたデータを同期
    const offlineData = await getOfflineData()
    
    if (offlineData.length > 0) {
      await syncOfflineData(offlineData)
      await clearOfflineData()
    }
    
    console.log('Background sync completed')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// オフラインデータの取得
async function getOfflineData() {
  try {
    const db = await openDB()
    // IndexedDBからオフラインデータを取得
    return []
  } catch (error) {
    console.error('Failed to get offline data:', error)
    return []
  }
}

// オフラインデータの同期
async function syncOfflineData(data) {
  try {
    for (const item of data) {
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      })
    }
  } catch (error) {
    console.error('Failed to sync offline data:', error)
  }
}

// オフラインデータのクリア
async function clearOfflineData() {
  try {
    const db = await openDB()
    // IndexedDBのオフラインデータをクリア
  } catch (error) {
    console.error('Failed to clear offline data:', error)
  }
}

// IndexedDBの初期化
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VegiriceOfflineDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = event => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// プッシュ通知の処理
self.addEventListener('push', event => {
  console.log('Service Worker: Push message received', event)
  
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: '確認',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: '閉じる',
          icon: '/icons/action-dismiss.png'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// 通知クリックの処理
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click received', event)
  
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  } else if (event.action === 'dismiss') {
    // 通知を閉じるだけ
  } else {
    // 通知をクリック（アクションボタンではない）
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})

// メッセージの処理
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_REFRESH') {
    event.waitUntil(refreshCache())
  }
})

// キャッシュの更新
async function refreshCache() {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME)
    
    for (const asset of STATIC_ASSETS) {
      try {
        const response = await fetch(asset)
        if (response.ok) {
          await cache.put(asset, response)
        }
      } catch (error) {
        console.warn('Failed to refresh cache for', asset, error)
      }
    }
    
    console.log('Cache refreshed successfully')
  } catch (error) {
    console.error('Cache refresh failed:', error)
  }
}

console.log('Service Worker: Script loaded')