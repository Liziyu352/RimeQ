<template>
  <div class="element-renderer flex flex-col">
    <template v-for="(group, i) in renderGroups" :key="i">
      <!-- 行内元素组 -->
      <div
        v-if="group.type === 'inline'"
        class="px-3 py-2 text-[15px] break-words whitespace-pre-wrap leading-7 select-text"
      >
        <component
          :is="getElement(seg.type)"
          v-for="(seg, j) in group.segments"
          :key="j"
          :segment="seg"
          :group-id="props.groupId"
          :on-insert-mention="props.onInsertMention"
        />
      </div>
      <!-- 块级元素组 -->
      <div
        v-else
        class="block-element w-full overflow-hidden"
        :class="{ 'mt-1': i > 0 && renderGroups[i - 1]?.type === 'block' }"
      >
        <component
          :is="resolveComponent(group.segment)"
          :segment="group.segment"
          :group-id="props.groupId"
          :on-insert-mention="props.onInsertMention"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { getElement } from './elements/index'
import { QFace } from '@/utils/qface'
import { useSettingStore } from '@/stores'
import type { Segment, FaceSegment } from '@/types'

const props = defineProps<{
  segments: Segment[]
  groupId?: number
  onInsertMention?: (id: string, name: string) => void
}>()
const settingStore = useSettingStore()

// 决定组件类型
const resolveComponent = (seg: Segment) => {
  if (seg.type === 'face') return defineAsyncComponent(() => import('./elements/SuperFaceElement.vue'))
  return getElement(seg.type)
}

// 判断行内元素
const isInlineSegment = (seg: Segment) => {
  if (seg.type === 'text' || seg.type === 'at') return true
  // 表情类判断
  if (seg.type === 'face') {
    if (!settingStore.config.renderSuperFace) return true
    if (props.segments.filter(s => s.type !== 'reply').length > 1) return true
    const face = QFace.get((seg as FaceSegment).data.id)
    return face && (face.type === 'face' || face.type === 'emoji')
  }
  return false
}

// 计算分组结构
const renderGroups = computed(() => {
  if (!props.segments?.length) return []
  const groups: Array<{ type: 'inline'; segments: Segment[] } | { type: 'block'; segment: Segment }> = []
  let buffer: Segment[] = []
  const flush = () => {
    if (buffer.length) {
      groups.push({ type: 'inline', segments: [...buffer] })
      buffer = []
    }
  }
  for (const seg of props.segments) {
    if (seg.type === 'reply') continue
    if (isInlineSegment(seg)) {
      buffer.push(seg)
    } else {
      flush()
      groups.push({ type: 'block', segment: seg })
    }
  }
  flush()
  return groups
})
</script>
