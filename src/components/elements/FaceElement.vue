<template>
  <img
    :src="face.src"
    :alt="face.name"
    class="inline-block align-sub size-6 mx-0.5 pointer-events-none select-none"
    loading="lazy"
    draggable="false"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QFace } from '@/utils/qface'
import type { FaceSegment } from '@/types'

// 组件属性定义
const props = defineProps<{ segment: FaceSegment }>()

// 计算元数据
const face = computed(() => {
  const id = props.segment.data.id
  const info = QFace.get(id)
  if (!info) return { src: '', name: '[表情]' }
  return { src: info.assets?.dynamic || info.assets?.static, name: `[${info.name}]` }
})
</script>
