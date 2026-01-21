<template>
  <span class="break-words select-text" v-html="parsedText" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TextSegment } from '@/types'

const props = defineProps<{ segment: TextSegment }>()
const URL_REGEX = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:[a-zA-Z0-9]+\.)+[a-zA-Z0-9]{2,}(?:\/[^\s]*)?)/g

const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')

const parsedText = computed(() => {
  const raw = props.segment.data?.text || ''
  if (!raw) return ''
  return raw.replace(URL_REGEX, (url) => {
    const href = url.match(/^https?:\/\//i) ? url : `http://${url}`
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline hover:text-primary-hover transition-colors break-all cursor-pointer">${escapeHtml(url)}</a>`
  }).split('\n').map(line => escapeHtml(line)).join('<br>')
})
</script>
