// __CACHE_VERSION__ is substituted by the server (see server.js) with a hash
// of the app-shell files, so the cache name -- and therefore this whole
// service worker's identity as far as the browser is concerned -- changes
// automatically on any deploy that changes the app, without anyone needing
// to remember to bump a version string by hand.
const CACHE_NAME = 'russisch-leren-__CACHE_VERSION__';
const APP_SHELL = [
  '/',
  '/css/style.css',
  '/js/app.js',
  '/js/core.js',
  '/js/storage.js',
  '/js/srs.js',
  '/js/speech-input.js',
  '/js/dialogue.js',
  '/js/keyboard-trainer.js',
  '/js/phrasebook.js',
  '/js/dictation.js',
  '/js/match-game.js',
  '/js/stories.js',
  '/js/handwriting.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ---- Web Push: the daily study reminder ----
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Russisch Leren', {
      body: data.body || 'Tijd om te oefenen!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'russisch-leren-reminder',
      data: { url: data.url || '/#/dashboard' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/#/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return; // always go to the network for API calls
  if (url.pathname === '/sw.js') return; // never intercept the service worker script itself

  if (request.mode === 'navigate') {
    // network-first for page loads, so a logged-in session always sees fresh HTML when online
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // stale-while-revalidate for static app-shell assets (css/js/icons/manifest):
  // answer instantly from cache so the app stays fast and fully offline-capable,
  // but also refetch in the background and update the cache for next time.
  // Together with the auto-bumped CACHE_NAME above, this is what keeps an
  // already-installed PWA from getting stuck on stale CSS/JS after a deploy,
  // without anyone needing to clear their browser cache by hand.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
