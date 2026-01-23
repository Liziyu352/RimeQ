import { bot } from '@/api'

// 内存缓存
const rkeyCache = {
  private: null as string | null,
  group: null as string | null,
  expires: 0
}

/**
 * 刷新 URL 中的 rkey 参数
 * @param url - 原始 URL
 * @param type - rkey 类型
 * @param force - 是否强制刷新
 */
export async function refreshUrl(url: string, type: 'private' | 'group', force = false): Promise<string> {
  const now = Date.now()
  // 获取 rkey
  if (force || now >= rkeyCache.expires || !rkeyCache[type]) {
    try {
      const rkeyData = await bot.getRkey()
      if (Array.isArray(rkeyData)) {
        let ttl = 3600
        for (const item of rkeyData as Array<{ type: string; rkey?: string; ttl?: number }>) {
          if (item.type === 'private' && item.rkey) rkeyCache.private = item.rkey
          else if (item.type === 'group' && item.rkey) rkeyCache.group = item.rkey
          if (item.ttl) {
            const duration = parseInt(String(item.ttl), 10)
            if (!isNaN(duration)) ttl = duration
          }
        }
        rkeyCache.expires = Date.now() + (ttl - 60) * 1000
      } else if (rkeyData && typeof rkeyData === 'object') {
        const data = rkeyData as { private_key?: string; group_key?: string }
        if (data.private_key && data.group_key) {
            rkeyCache.private = data.private_key
            rkeyCache.group = data.group_key
            rkeyCache.expires = Date.now() + (3600 - 60) * 1000
        }
      }
    } catch (e) {
      console.error('[Utils] 获取 rkey 失败:', e)
      rkeyCache.expires = 0
      return url
    }
  }
  const newRkey = rkeyCache[type]
  if (!newRkey) return url
  // 更新 rkey
  try {
    const newUrl = new URL(url)
    const rkeyParams = new URLSearchParams(newRkey.startsWith('?') ? newRkey : `?${newRkey}`)
    const rkeyValue = rkeyParams.get('rkey')
    if (rkeyValue) newUrl.searchParams.set('rkey', rkeyValue)
    return newUrl.toString()
  } catch (e) {
    console.error('[Utils] 更新 rkey 失败:', e)
    return url
  }
}
