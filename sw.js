const CACHE_NAME = 'ar-rafeeq-v2';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './quran-local.json',
    './tafsir-saadi.min.json',
    './arbaeen-data.json',
    './adhan.mp3',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './assets/sun.png',
    './assets/topright.png',
    './assets/skyline.png',
    './assets/medallion.png',
    './assets/quran.png',
    './assets/books.png',
    './assets/tasbih.png',
    './assets/shield.png',
    './assets/qibla_q.png',
    './assets/adiya_q.png',
    './assets/mawaqit_q.png',
    './assets/more_q.png',
    './assets/nav_more.png',
    './assets/nav_hadith.png',
    './assets/nav_home.png',
    './assets/nav_quran.png',
    './assets/nav_qibla.png',
    './assets/adhanmosque.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ تم فتح الكاش');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ حذف الكاش القديم:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
        .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        return new Response('⚠️ لا يوجد اتصال بالإنترنت', { status: 503 });
                    });
            })
    );
});
