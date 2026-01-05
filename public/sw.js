const CACHE_NAME = 'water-monitor-cache-v1'
const URLS_TO_CACHE = ['/', '/index.html', '/vite.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key)
        })
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // navigation requests: try network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // for other requests, try cache first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  )
})
