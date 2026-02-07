/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

// TS 类型声明
declare let self: ServiceWorkerGlobalScope

// 允许消息激活
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// 控制页面
clientsClaim()
// 清理缓存
cleanupOutdatedCaches()
// 缓存代码
precacheAndRoute(self.__WB_MANIFEST || [])
