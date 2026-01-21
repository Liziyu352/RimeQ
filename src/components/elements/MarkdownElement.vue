<template>
  <div
    class="markdown-body break-words whitespace-pre-wrap leading-relaxed select-text px-3 py-2.5"
    v-html="html"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import type { MarkdownSegment } from '@/types'

const md = new MarkdownIt({ html: false, breaks: true, linkify: true })

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('target' in node) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

const props = defineProps<{ segment: MarkdownSegment }>()
const html = computed(() => DOMPurify.sanitize(md.render(props.segment.data.content || '')))
</script>

<style>
.markdown-body p:first-child { margin-top: 0; }
.markdown-body p:last-child { margin-bottom: 0; }
.markdown-body a { color: var(--primary-color); text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body code { background-color: var(--color-dim); padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
.markdown-body pre { background-color: var(--color-dim); padding: 1em; border-radius: 8px; overflow-x: auto; }
.markdown-body blockquote { border-left: 4px solid var(--primary-soft); padding-left: 1em; color: var(--text-sub); margin: 0.5em 0; }
</style>
