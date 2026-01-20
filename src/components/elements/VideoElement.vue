<template>
  <div class="my-1 rounded-xl overflow-hidden bg-black max-w-xs md:max-w-sm shadow-md border border-background-dim/50">
    <video
      :src="videoUrl"
      :poster="poster"
      controls
      preload="metadata"
      class="w-full max-h-[360px] object-contain"
      referrerpolicy="no-referrer"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { VideoSegment } from '@/types'

const props = defineProps<{ segment: VideoSegment }>()

const videoUrl = computed(() => {
  const d = props.segment.data
  if (d.url) return d.url
  if (d.file && d.file.startsWith('http')) return d.file
  return ''
})

const poster = computed(() => {
  const d = props.segment.data
  // 如果有缩略图，且是 base64
  if (d.thumb) return `data:image/jpeg;base64,${d.thumb}`
  return ''
})
</script>
