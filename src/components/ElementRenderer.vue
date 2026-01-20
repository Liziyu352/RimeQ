<template>
  <template v-for="(group, i) in groupedSegments" :key="i">
    <!-- 块级元素 (独占一行，如视频、转发卡片) -->
    <div v-if="group.type === 'block'" class="w-full py-0.5 select-text">
      <component
        :is="getElement(group.segment.type)"
        :segment="group.segment"
        :group-id="groupId"
      />
    </div>

    <!-- 行内元素组 (文本、表情、@等混排) -->
    <span v-else class="whitespace-pre-wrap break-words align-bottom">
      <component
        v-for="(seg, j) in group.segments"
        :key="j"
        :is="getElement(seg.type)"
        :segment="seg"
        :group-id="groupId"
        @mention="(item) => emit('mention', item)"
      />
    </span>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getElement } from './elements/index'
import type { Segment } from '@/types'

const props = defineProps<{
  segments: Segment[]
  groupId?: number
}>()

const emit = defineEmits<{
  (e: 'mention', item: { id: string; name: string }): void
}>()

// 定义哪些类型应视为行内元素
// 注意：图片(image)在这里视情况而定，如果希望图片混排则放入，如果希望大图独占则移出
// 这里的逻辑保持 image 不在 INLINE_TYPES 中，意味着图片默认独占一行块级显示（符合大多数IM体验）
// 只有表情(face)、文本(text)、@用户(at)、猜拳骰子(dice/rps) 视为行内
const INLINE_TYPES = new Set(['text', 'at', 'face', 'dice', 'rps'])

// 将消息段重组为 [块, 行内组, 块, 行内组...] 的结构
const groupedSegments = computed(() => {
  const result: Array<
    | { type: 'block'; segment: Segment }
    | { type: 'inline'; segments: Segment[] }
  > = []

  if (!props.segments?.length) return result

  let currentInline: Segment[] = []

  const flushInline = () => {
    if (currentInline.length) {
      result.push({ type: 'inline', segments: [...currentInline] })
      currentInline = []
    }
  }

  for (const seg of props.segments) {
    // 过滤掉不需要渲染的段 (如回复引用，通常由父级气泡处理)
    if (seg.type === 'reply') continue

    if (INLINE_TYPES.has(seg.type)) {
      currentInline.push(seg)
    } else {
      flushInline()
      result.push({ type: 'block', segment: seg })
    }
  }
  flushInline()

  return result
})
</script>
