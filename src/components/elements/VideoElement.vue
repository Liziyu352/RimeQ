<template>
  <div class="relative w-full bg-black ui-flex-center group overflow-hidden rounded-lg">
    <video
      :src="videoUrl"
      :poster="poster"
      controls
      preload="metadata"
      class="block w-full max-h-[400px] object-contain"
      referrerpolicy="no-referrer"
    />
    <!-- 播放遮罩 -->
    <div class="absolute inset-0 ui-flex-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
      <div class="i-ri-play-circle-line text-4xl text-white/80 drop-shadow-md" />
    </div>
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
  if (d.thumb) return `data:image/jpeg;base64,${d.thumb}`
  return ''
})
</script>
