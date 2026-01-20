<template>
  <div
    class="flex items-center gap-3 p-3 my-1 rounded-xl bg-background-sub border border-background-dim hover:border-primary/50 hover:bg-background-dim/30 transition-all cursor-pointer shadow-sm group w-full max-w-sm"
    @click="download"
  >
    <!-- 图标 -->
    <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
      <div class="i-ri-file-line text-2xl text-primary" />
    </div>

    <!-- 信息 -->
    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <span class="text-sm font-bold text-foreground-main truncate">{{ fileName }}</span>
      <div class="flex items-center gap-2 text-[10px] text-foreground-dim">
        <span>{{ fileSize }}</span>
        <span v-if="isFlash" class="px-1.5 rounded bg-red-500/10 text-red-500">闪照</span>
      </div>
    </div>

    <!-- 下载按钮 -->
    <div class="w-8 h-8 rounded-full flex items-center justify-center text-foreground-sub hover:bg-background-dim hover:text-primary transition-colors">
      <div class="i-ri-download-2-line text-lg" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatFileSize } from '@/utils/format'
import type { FileSegment, FlashSegment } from '@/types'

const props = defineProps<{ segment: FileSegment | FlashSegment }>()

const isFlash = computed(() => props.segment.type === 'flash_file')

const fileName = computed(() => {
  if (isFlash.value) return (props.segment as FlashSegment).data.title || '闪照文件'
  return (props.segment as FileSegment).data.name || '未知文件'
})

const fileSize = computed(() => {
  if (isFlash.value) return '未知大小'
  return formatFileSize((props.segment as FileSegment).data.file_size || 0)
})

const download = () => {
  const data = props.segment.data as any
  const url = data.url
  if (url) window.open(url, '_blank')
}
</script>
