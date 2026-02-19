import { bot } from '@/api'

// 内存缓存
const rkeyCache = {
  private: null as string | null,
  group: null as string | null,
  expires: 0
}

let fetchPromise: Promise<void> | null = null

/**
 * 刷新 URL 中的 rkey 参数
 * @param url - 原始 URL
 * @param type - rkey 类型
 * @param force - 是否强制刷新
 */
export async function refreshUrl(url: string, type: 'private' | 'group', force = false): Promise<string> {
  const now = Date.now()
  const needsRefresh = force || !rkeyCache[type] || now >= rkeyCache.expires
  if (needsRefresh) {
    if (!fetchPromise) {
      fetchPromise = (async () => {
        try {
          const rkeyData = await bot.getRkey()
          if (Array.isArray(rkeyData)) {
            let ttl = 3600
            for (const item of rkeyData) {
              if (item.type === 'private' && item.rkey) rkeyCache.private = item.rkey
              if (item.type === 'group' && item.rkey) rkeyCache.group = item.rkey
              if (item.ttl) ttl = Number(item.ttl)
            }
            rkeyCache.expires = Date.now() + (ttl - 300) * 1000
          } else if (rkeyData && typeof rkeyData === 'object') {
            const data = rkeyData as any
            if (data.private_key) rkeyCache.private = data.private_key
            if (data.group_key) rkeyCache.group = data.group_key
            rkeyCache.expires = Date.now() + 3000 * 1000
          }
        } catch (e) {
          console.error('[Utils] 获取 rkey 失败:', e)
        } finally {
          fetchPromise = null
        }
      })()
    }
    await fetchPromise
  }
  const rkeyString = rkeyCache[type]
  if (!rkeyString) return url
  try {
    const newUrl = new URL(url)
    let token = rkeyString
    if (rkeyString.includes('rkey=')) {
      const cleanString = rkeyString.replace(/^[?&]+/, '')
      const params = new URLSearchParams(cleanString)
      token = params.get('rkey') || token
    }
    if (token) newUrl.searchParams.set('rkey', token)
    return newUrl.toString()
  } catch (e) {
    console.error('[Utils] 更新 rkey 失败:', e)
    return url
  }
}
