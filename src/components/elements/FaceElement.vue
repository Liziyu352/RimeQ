<template>
  <div
    class="inline-block align-middle select-none relative group"
    :class="isSuper ? 'w-12 h-12 mx-1' : 'w-6 h-6 mx-0.5'"
    :title="faceInfo?.name"
  >
    <img
      v-if="src"
      :src="src"
      class="w-full h-full object-contain pointer-events-none"
      draggable="false"
      loading="lazy"
      :alt="`[${faceInfo?.name || '表情'}]`"
    />
    <span v-else class="text-xs text-foreground-dim">[表情:{{ segment.data.id }}]</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QFace } from '@/utils/qface'
import type { FaceSegment } from '@/types'

const props = defineProps<{ segment: FaceSegment }>()

const faceInfo = computed(() => QFace.get(String(props.segment.data.id)))

const src = computed(() => {
  if (!faceInfo.value) return ''
  // 优先使用动态图，其次静态
  return faceInfo.value.assets.dynamic || faceInfo.value.assets.static
})

const isSuper = computed(() => {
  const t = faceInfo.value?.type
  return t === 'super' || t === 'other'
})
</script>
