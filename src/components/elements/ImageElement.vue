<template>
  <div class="relative w-full group select-none">
    <!-- 图片容器 -->
    <div
      class="relative w-full min-h-[100px] bg-background-dim/5 transition-colors flex flex-col"
      :class="{ 'h-32 ui-flex-center': hasError }"
    >
      <Image
        v-if="!hasError"
        :src="imageUrl"
        preview
        image-class="block w-full h-auto max-h-[500px] object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
        class="size-full ui-flex-center"
        referrerpolicy="no-referrer"
        loading="lazy"
        @error="hasError = true"
      >
        <template #indicator>
          <div class="i-ri-loader-4-line animate-spin text-primary text-2xl" />
        </template>
      </Image>

      <!-- 错误状态 -->
      <div v-else class="flex flex-col items-center gap-1 text-foreground-dim">
        <div class="i-ri-image-off-line text-xl" />
        <span class="text-[10px]">图片裂开了</span>
      </div>

      <!-- 摘要 (MFace) -->
      <div
        v-if="summary"
        class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] px-2 py-1 backdrop-blur-[2px] truncate"
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
  if ('url' in d && d.url) return d.url
  if ('file' in d) {
    if (d.file.startsWith('http')) return d.file
    if (d.file.startsWith('base64://')) return `data:image/png;base64,${d.file.slice(9)}`
    return d.file
  }
  return ''
})

const summary = computed(() => (props.segment.data as any).summary || '')
</script>
