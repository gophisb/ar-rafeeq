// sw.js — الرفيق: Service Worker للعمل دون اتصال بالإنترنت
// النسخة 7: إضافة hisnul.html وحذف النسخ المكررة من الكاش القديم
const CACHE_NAME = 'ar-rafeeq-v7';
const TAFSIR_CACHE = 'ar-rafeeq-tafsir-v1'; // كاش دائم للتفسير الميسّر (نص ثابت لا يتغير)

// قائمة بكل ملفات التطبيق الأساسية (Shell) التي تُخزَّن عند أول تثبيت
// الآن تشمل hisnul.html
const APP_SHELL = [
  './', './index.html', './style.css',
  './prayer.html', './azkar.html',
  './arbaeen.html', './arbaeen-data.json',
  './quran.html', './qibla.html', './hisnul.html',
  './quran-local.json',
  './audio/adhan.mp3',
  './assets/medallion.png', './assets/quran.png', './assets/books.png',
  './assets/tasbih.png', './assets/shield.png', './assets/sun.png',
  './assets/topright.png', './assets/skyline.png', './assets/adhanmosque.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          // نحذف الكاشات القديمة (الإصدارات السابقة) ونحتفظ فقط بالكاش الحالي وكاش التفسير
          .filter((key) => key !== CACHE_NAME && key !== TAFSIR_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isTafsirApi = url.hostname === 'api.alquran.cloud';
  const isPrayerApi = url.hostname === 'api.aladhan.com';

  // 1. الملفات المحلية (نفس المصدر)
  if (isSameOrigin) {
    // استراتيجية: شبكة أولاً، ثم الكاش عند الفشل (لتحديث الملفات إن تغيرت)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // 2. واجهة التفسير (API القرآن) - كاش أولاً لأن النص ثابت
  if (isTafsirApi) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(TAFSIR_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 3. واجهة المواقيت (Aladhan) - شبكة أولاً إلزامياً (لأنها تتغير يومياً)
  if (isPrayerApi) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. أي طلب خارجي آخر (مثل خطوط Google Fonts) - كاش أولاً بسيط
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
