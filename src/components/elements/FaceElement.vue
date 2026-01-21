<template>
  <img
    v-if="src"
    :src="src"
    :alt="name"
    class="inline-block align-sub size-6 mx-0.5 pointer-events-none select-none"
    loading="lazy"
    draggable="false"
  />
  <span v-else class="text-xs text-foreground-dim select-none">[表情]</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QFace } from '@/utils/qface'
import type { FaceSegment } from '@/types'

const props = defineProps<{ segment: FaceSegment }>()

const info = computed(() => {
  const id = String(props.segment.data.id)
  return QFace.get(id)
})

// 优先使用动态图 (APNG)，没有则使用静态图
const src = computed(() => info.value?.assets?.dynamic || info.value?.assets?.static)
const name = computed(() => info.value ? `[${info.value.name}]` : '')
</script>
