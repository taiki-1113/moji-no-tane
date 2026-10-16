const SHELL_CACHE = 'moji-shell-v10';
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
  const shellResource = SHELL.some(path => new URL(path,self.location).pathname === new URL(request.url).pathname);
  event.respondWith((async () => {
    const shell = await caches.open(SHELL_CACHE);
    const assets = await caches.open(ASSET_CACHE);
    const cached = await (shellResource ? shell.match(request,{ignoreSearch:true}) : assets.match(request,{ignoreSearch:true}));
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await (shellResource ? shell : assets).put(request,response.clone());
      return response;
    } catch {
      if (request.mode==='navigate') return (await shell.match('./index.html',{ignoreSearch:true})) || Response.error();
      return Response.error();
    }
  })());
});
