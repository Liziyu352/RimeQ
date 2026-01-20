<template>
  <!-- 使用 v-html 渲染包含链接的文本，已做转义处理 -->
  <span class="break-words select-text" v-html="parsedText" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TextSegment } from '@/types'

const props = defineProps<{ segment: TextSegment }>()

// 更完善的 URL 匹配正则
const URL_REGEX = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:[a-zA-Z0-9]+\.)+[a-zA-Z0-9]{2,}(?:\/[^\s]*)?)/g

const escapeHtml = (str: string) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const parsedText = computed(() => {
  const raw = props.segment.data?.text || ''
  if (!raw) return ''

  // 先转义 HTML 防止 XSS
  // 然后将 URL 替换为 a 标签
  return raw.replace(URL_REGEX, (url) => {
    const href = url.match(/^https?:\/\//i) ? url : `http://${url}`
    // 在转义后的文本中插入未转义的 HTML 标签是安全的，因为 href 是我们构造的
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline hover:text-primary-hover transition-colors break-all cursor-pointer">${escapeHtml(url)}</a>`
  }).split('\n').map(line => escapeHtml(line)).join('<br>') // 处理换行，如果使用 v-html
})
</script>
