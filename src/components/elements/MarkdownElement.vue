<template>
  <div
    class="markdown-body text-sm text-foreground-main leading-relaxed break-words"
    v-html="html"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import type { MarkdownSegment } from '@/types'

// 单例模式，避免重复实例化
const md = new MarkdownIt({
  html: false, // 禁用 HTML 标签，防止 XSS
  breaks: true,
  linkify: true
})

// 安全 hook
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('target' in node) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

const props = defineProps<{ segment: MarkdownSegment }>()

const html = computed(() => {
  const content = props.segment.data.content || ''
  // 先渲染 Markdown，再进行净化
  return DOMPurify.sanitize(md.render(content))
})
</script>

<style>
/* 简单的 Markdown 样式覆盖，适配 UnoCSS 变量 */
.markdown-body a {
  color: var(--primary-color);
  text-decoration: none;
}
.markdown-body a:hover {
  text-decoration: underline;
}
.markdown-body code {
  background-color: var(--color-dim);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}
.markdown-body pre {
  background-color: var(--color-dim);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
}
.markdown-body blockquote {
  border-left: 4px solid var(--primary-soft);
  padding-left: 1em;
  color: var(--text-sub);
  margin: 0.5em 0;
}
</style>
