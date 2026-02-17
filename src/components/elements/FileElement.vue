<template>
  <div
    class="ui-flex-x gap-3 p-3 w-full ui-ia relative rounded-xl group"
    @click="download"
  >
    <!-- 图标 -->
    <div
      class="relative size-12 shrink-0 ui-flex-center rounded-lg overflow-hidden"
    >
      <div :class="[iconInfo.icon, iconInfo.color, 'text-3xl']" />
      <!-- 下载遮罩 -->
      <div class="absolute inset-0 ui-flex-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
        <div class="i-ri-download-line text-xl" />
      </div>
    </div>
    <!-- 信息 -->
    <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
      <span class="text-xs font-bold truncate break-all leading-tight" :title="fileName">
        {{ fileName }}
      </span>
      <div class="ui-flex-x gap-2 text-xs opacity-60 font-mono">
        <span>{{ fileSize }}</span>
        <span v-if="isFlash" class="px-1.5 py-0.5 rounded font-bold text-[10px] leading-none opacity-100">闪传</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatFileSize, getFileIcon } from '@/utils/format'
import type { FileSegment, FlashSegment } from '@/types'

// 定义属性
const props = defineProps<{ segment: FileSegment | FlashSegment }>()

// 闪传判断
const isFlash = computed(() => props.segment.type === 'flash_file')

// 计算文件名
const fileName = computed(() => {
  if (isFlash.value) return (props.segment as FlashSegment).data.title
  const d = (props.segment as FileSegment).data
  return d.name || (d.file ? d.file.split(/[/\\]/).pop() : '') || '未知文件'
})

// 计算文件大小
const fileSize = computed(() => formatFileSize(Number((props.segment as FileSegment).data.file_size) || 0))

// 获取图标样式
const iconInfo = computed(() => getFileIcon(fileName.value))

// 执行下载
const download = () => {
  const data = props.segment.data as any
  if (data.url) window.open(data.url, '_blank')
}
</script>
