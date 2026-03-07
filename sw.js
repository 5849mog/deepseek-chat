const CACHE_NAME = 'deepseek-chat-v2';

// 你想要直接预加载缓存的核心文件
const CORE_ASSETS =[
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // 强制立刻接管
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // 1. 完全忽略发给 DeepSeek 的 API 请求（保障每次对话实时拉取）
  if (req.method !== 'GET' || req.url.includes('/chat/completions')) return;

  // 2. 对其它资源（HTML/CSS/JS/CDN字体库）使用 Stale-While-Revalidate（有缓存先用缓存，后台更新）
  e.respondWith(
    caches.match(req).then(cachedRes => {
      const fetchPromise = fetch(req).then(networkRes => {
        // 只缓存请求成功的数据
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return networkRes;
      }).catch(() => {
        // 无网状态会进入 catch，直接降级返回 cachedRes
      });
      
      return cachedRes || fetchPromise;
    })
  );
});
