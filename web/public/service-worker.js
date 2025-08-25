const CACHE_NAME = 'flex-share-pwa-cache-v1'

self.addEventListener('install', event => {
	event.waitUntil(caches.open(CACHE_NAME).then(() => self.skipWaiting()))
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
	event.respondWith(
		caches.match(event.request).then(response => {
			return response || fetch(event.request)
		}),
	)
})
