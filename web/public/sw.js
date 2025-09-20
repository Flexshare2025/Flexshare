const CACHE_NAME = 'flex-share-pwa-cache-v1'
const urlsToCache = ['/', '/index.html', '/manifest.json', 'car.svg', 'logo192.png', 'logo512.png']

self.addEventListener('install', event => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then(cache => cache.addAll(urlsToCache))
			.then(() => self.skipWaiting())
			.catch(err => console.error('error:', err)),
	)
})

self.addEventListener('activate', event => {
	event.waitUntil(
		caches
			.keys()
			.then(cacheNames => {
				return Promise.all(
					cacheNames.map(cache => {
						if (cache !== CACHE_NAME) {
							return caches.delete(cache)
						}
					}),
				)
			})
			.then(() => self.clients.claim()),
	)
})

self.addEventListener('fetch', event => {
	if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
		event.respondWith(fetch(event.request))
		return
	}

	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch(() => {
				return caches.match('/index.html')
			}),
		)
		return
	}

	event.respondWith(
		caches.match(event.request).then(response => {
			const fetchPromise = fetch(event.request).then(networkResponse => {
				if (networkResponse.status === 200 && networkResponse.type === 'basic') {
					caches.open(CACHE_NAME).then(cache => {
						cache.put(event.request, networkResponse.clone())
					})
				}
				return networkResponse
			})

			return response || fetchPromise
		}),
	)
})
