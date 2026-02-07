import type { Response } from '@/types'

/**
 * HTTP & SSE 通信服务核心
 * @description
 * 负责底层的 HTTP 连接管理，包括发送 POST 请求，维护 SSE 连接、断开重连等功能。
 */
export class HttpSse {
  /** 当前连接地址 */
  private url = ''
  /** 当前连接 Token */
  private token = ''
  /** SSE 实例 */
  private source: EventSource | null = null

  /** 重连倒计时定时器 */
  private reconnectTimer?: number

  /** 全局消息监听回调 */
  private listener?: (data: any) => void

  /**
   * 注册全局事件接收器
   * @param fn - 接收数据的回调函数
   */
  public onReceive(fn: (data: any) => void) {
    this.listener = fn
  }

  /**
   * 建立 SSE 连接
   * @param url HTTP API 地址
   * @param token 鉴权 Token
   */
  async connect(url: string, token: string): Promise<void> {
    this.disconnect()
    this.url = url
    this.token = token

    return new Promise((resolve) => {
      this.source = new EventSource(`${this.url}/events?access_token=${encodeURIComponent(token)}`)

      this.source.onopen = () => resolve()

      this.source.onerror = (e) => {
        console.error('[API] SSE 连接出错:', e)
        if (this.source?.readyState === EventSource.CLOSED) this.reconnect()
      }

      this.source.onmessage = (event) => {
        const data = JSON.parse(event.data)
        this.listener?.(data)
      }
    })
  }

  /**
   * 发送 API 请求
   */
  async request<T>(action: string, params: Record<string, any> = {}): Promise<T> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`

    const res = await fetch(`${this.url}/${action}`, { method: 'POST', headers, body: JSON.stringify(params) })
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${res.statusText}`)

    const data: Response<T> = await res.json()
    if (data.status === 'ok' || data.retcode === 0) return data.data
    throw new Error(data.message || data.wording || `Error Code ${data.retcode}`)
  }

  /**
   * 断开连接
   */
  disconnect() {
    clearTimeout(this.reconnectTimer)
    if (this.source) {
      this.source.close()
      this.source = null
    }
  }

  /**
   * 重新连接
   */
  private reconnect() {
    this.disconnect()
    this.reconnectTimer = window.setTimeout(() => this.connect(this.url, this.token), 3000)
  }
}

export const httpsse = new HttpSse()
