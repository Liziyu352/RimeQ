import { useContactStore } from '@/stores/contact'
import type { Segment } from '@/types'
import { QFace } from '@/utils/qface'

/**
 * 字节大小转换为文件大小
 * @param bytes - 文件大小（字节）
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

/**
 * 根据时间戳生成时间显示
 * @param timestamp - Unix 时间戳 (毫秒)
 * @returns 格式化后的时间字符串
 */
export function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24))
  // 当天
  if (diffDays === 0) return d.toLocaleTimeString('zh-CN', { hour12: false }) // HH:mm:ss
  // 月内
  if (diffDays > 0 && diffDays < 30) {
    const date = d.getDate()
    const hour = d.getHours().toString().padStart(2, '0')
    const minute = d.getMinutes().toString().padStart(2, '0')
    return `${date} ${hour}:${minute}`
  }
  // 同年
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) // M/D
  // 跨年
  return d.toLocaleDateString('zh-CN', { year: '2-digit', month: 'numeric', day: 'numeric' }) // YY/M/D
}

/**
 * 格式化秒数为时长
 * @param seconds - 秒数
 * @returns 格式化后的时长字符串
 */
export function formatDuration(seconds: number | string): string {
  const sec = parseInt(String(seconds))
  if (isNaN(sec) || sec < 0) return ''
  const units: [string, number][] = [['天', 86400], ['小时', 3600], ['分钟', 60], ['秒', 1]]
  const parts: string[] = []
  units.reduce((acc, [label, value]) => {
    const count = Math.floor(acc / value)
    if (count > 0) parts.push(`${count}${label}`)
    return acc % value
  }, sec)
  return parts.join(' ')
}

/**
 * 生成纯文本预览
 * @param message - 消息内容
 * @param groupId - (可选) 所属群号，用于显示昵称
 * @returns 预览文本
 */
export function getTextPreview(message: Segment[], groupId?: number | string): string {
  const contactStore = useContactStore()
  let text = ''
  for (const seg of message) {
    switch (seg.type) {
      case 'text':
        text += seg.data.text
        break
      case 'at':
        text += `@${seg.data.qq === 'all' ? '全体成员' : contactStore.getUserName(seg.data.qq || '', groupId)} `
        break
      case 'image':
      case 'mface':
        text += seg.data.summary || '[图片]'
        break
      case 'record':
        text += '[语音]'
        break
      case 'video':
        text += '[视频]'
        break
      case 'file':
        text += `[文件]${seg.data.file}`
        break
      case 'dice':
        text += `[骰子|${seg.data.result} 点]`
        break
      case 'rps':
        const rps: Record<string, string> = { '1': '布', '2': '剪刀', '3': '石头' };
        text += `[猜拳|${rps[String(seg.data.result)]}]`;
        break
      case 'face':
        const face = QFace.get(String(seg.data.id))
        text += face ? `[${face.name}]` : `[表情]`
        break
      case 'forward':
        text += '[聊天记录]'
        break
      case 'xml':
        const match = seg.data.data?.match(/title="([^"]*)"|<title>([^<]*)<\/title>/);
        text += match?.[1] || match?.[2] || '[卡片]';
        break;
      case 'json':
        const raw = seg.data.data;
        const json = typeof raw === 'string' ? JSON.parse(raw) : raw;
        text += json.prompt || '[卡片]';
        break;
      case 'reply':
        break
      default:
        text += `[${seg.type}]`
        break
    }
  }
  return text
}

/**
 * 获取文件图标样式
 * @param name 文件名
 * @param type 类型
 */
export function getFileIcon(name: string, type: string = 'file'): { icon: string; color: string } {
  if (type === 'folder') return { icon: 'i-ri-folder-3-fill', color: 'text-yellow-500' }
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const defaultIcon = { icon: 'i-ri-file-line', color: 'text-foreground-dim' }
  const icons: Record<string, { icon: string; color: string }> = {
    jpg: { icon: 'i-ri-image-2-line', color: 'text-purple-500' },
    png: { icon: 'i-ri-image-2-line', color: 'text-purple-500' },
    gif: { icon: 'i-ri-image-2-line', color: 'text-purple-500' },
    svg: { icon: 'i-ri-image-2-line', color: 'text-purple-500' },
    mp4: { icon: 'i-ri-movie-line', color: 'text-indigo-500' },
    mp3: { icon: 'i-ri-music-2-line', color: 'text-pink-500' },
    zip: { icon: 'i-ri-folder-zip-line', color: 'text-red-500' },
    rar: { icon: 'i-ri-folder-zip-line', color: 'text-red-500' },
    '7z': { icon: 'i-ri-folder-zip-line', color: 'text-red-500' },
    doc: { icon: 'i-ri-file-text-line', color: 'text-blue-500' },
    docx: { icon: 'i-ri-file-text-line', color: 'text-blue-500' },
    pdf: { icon: 'i-ri-file-pdf-line', color: 'text-red-600' },
    xls: { icon: 'i-ri-file-excel-2-line', color: 'text-green-500' },
    xlsx: { icon: 'i-ri-file-excel-2-line', color: 'text-green-500' },
    ppt: { icon: 'i-ri-file-ppt-2-line', color: 'text-orange-500' },
    pptx: { icon: 'i-ri-file-ppt-2-line', color: 'text-orange-500' },
    js: { icon: 'i-ri-javascript-line', color: 'text-yellow-400' },
    json: { icon: 'i-ri-braces-line', color: 'text-gray-500' },
    html: { icon: 'i-ri-html5-line', color: 'text-orange-600' },
    css: { icon: 'i-ri-css3-line', color: 'text-blue-600' },
    apk: { icon: 'i-ri-android-line', color: 'text-green-600' },
    exe: { icon: 'i-ri-windows-line', color: 'text-blue-600' },
    txt: { icon: 'i-ri-file-text-line', color: 'text-gray-500' },
    md: { icon: 'i-ri-markdown-line', color: 'text-blue-400' },
  }
  return icons[ext] || defaultIcon
}
