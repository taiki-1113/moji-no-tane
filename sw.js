const SHELL_CACHE = 'moji-shell-v2';
const ASSET_CACHE = 'moji-assets-v1';
const SHELL = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './assets/icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![SHELL_CACHE,ASSET_CACHE].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(request, {ignoreSearch:true}).then(cached => cached || fetch(request).then(response => {
    if (response.ok) { const copy=response.clone(); caches.open(request.destination==='document'?SHELL_CACHE:ASSET_CACHE).then(cache=>cache.put(request,copy)); }
    return response;
  }).catch(() => request.mode==='navigate' ? caches.match('./index.html') : Response.error())));
});
