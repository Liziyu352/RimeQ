<template>
  <div class="block my-1 max-w-full w-fit">
    <!-- 容器：限制最大宽高，圆角，加载背景 -->
    <div
      class="relative rounded-xl overflow-hidden bg-background-dim/30 border border-background-dim/50 transition-all min-w-[48px] min-h-[48px]"
      :class="[hasError ? 'w-32 h-32 flex items-center justify-center' : '']"
    >
      <Image
        v-if="!hasError"
        :src="imageUrl"
        preview
        image-class="block max-w-full max-h-[400px] object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
        referrerpolicy="no-referrer"
        loading="lazy"
        @error="hasError = true"
      >
        <template #indicator>
          <div class="i-ri-loader-4-line animate-spin text-white text-2xl" />
        </template>
      </Image>

      <!-- 错误状态 -->
      <div v-else class="flex flex-col items-center justify-center gap-2 text-foreground-dim p-4">
        <div class="i-ri-image-off-line text-2xl" />
        <span class="text-xs">图片加载失败</span>
      </div>

      <!-- 摘要（针对 mface） -->
      <div
        v-if="summary"
        class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 backdrop-blur-sm truncate"
      >
        {{ summary }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Image } from 'primevue'
import type { ImageSegment, MFaceSegment } from '@/types'

const props = defineProps<{ segment: ImageSegment | MFaceSegment }>()
const hasError = ref(false)

const imageUrl = computed(() => {
  const d = props.segment.data
  // 处理 mface
  if ('url' in d && d.url) return d.url
  // 处理 image
  if ('file' in d) {
    if (d.file.startsWith('http')) return d.file
    if (d.file.startsWith('base64://')) return `data:image/png;base64,${d.file.slice(9)}`
    // 处理 base64 不带前缀的情况 (视后端实现而定)
    if (d.file.length > 200 && !d.file.includes('/') && !d.file.includes('.')) {
      return `data:image/png;base64,${d.file}`
    }
    return d.file
  }
  return ''
})

const summary = computed(() => (props.segment.data as any).summary || '')
</script>
