<template>
  <span v-html="parsedText" />
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { TextSegment } from '@/types'
import { SearchKey } from '@/types'

const props = defineProps<{ segment: TextSegment }>()

// 注入搜索关键词
const searchKeyword = inject(SearchKey, ref(''))
// HTML 特殊字符转义
const ESCAPE_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }

/**
 * 提取关键词
 * @param input - 搜索框的输入
 */
const getKeywords = (input: string): string[] => {
  const raw = input.trim()
  if (!raw) return []
  if (raw.includes(' ')) return raw.split(/\s+/).filter(Boolean)
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter('zh-CN', { granularity: 'word' })
      return [...segmenter.segment(raw)]
        .filter(s => s.isWordLike)
        .map(s => s.segment)
    } catch { /* 忽略 */ }
  }
  return raw.split('')
}

/**
 * 解析文本
 */
const parsedText = computed(() => {
  const rawText = props.segment.data?.text
  if (!rawText) return ''
  const tokens = getKeywords(searchKeyword.value)
  let highlightReg: RegExp | null = null
  if (tokens.length > 0) {
    const pattern = tokens
      .sort((a, b) => b.length - a.length)
      .map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    highlightReg = new RegExp(`(${pattern})`, 'gi')
  }
  return rawText
    .split(/((?:https?:\/\/)?(?:(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})|(?:\d{1,3}\.){3}\d{1,3})(?::\d{1,5})?(?:[/?#][^\s]*)?|[\w.+-]+@[\w-]+\.[\w.-]+)/i)
    .map((part, index) => {
      if (!part) return ''
      if (index % 2 === 0) {
        let text = part.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]!)
        if (highlightReg) text = text.replace(highlightReg, '<span class="text-primary font-bold bg-primary/10 rounded-sm">$1</span>')
        return text
      }
      const escapedPart = part.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]!)
      if (part.includes('@') && !part.toLowerCase().startsWith('http')) {
        return `<a href="mailto:${escapedPart}" class="text-primary hover:underline cursor-pointer select-all">${escapedPart}</a>`
      } else {
        const href = /^https?:\/\//i.test(part) ? escapedPart : `http://${escapedPart}`
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline hover:text-primary-hover break-all cursor-pointer">${escapedPart}</a>`
      }
    })
    .join('')
})
</script>
