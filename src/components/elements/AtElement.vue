<template>
  <span
    class="text-primary font-medium hover:underline ui-ia"
    @click.stop="handleClick"
  >
    @{{ displayName }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContactStore } from '@/stores'
import { type AtSegment } from '@/types'

// 组件属性定义
const props = defineProps<{
  segment: AtSegment
  groupId?: number
  onInsertMention?: (id: string, name: string) => void
}>()

// 依赖注入
const contactStore = useContactStore()

// 计算属性：显示名称
const displayName = computed(() => {
  if (props.segment.data.qq === 'all') return '全体成员'
  const id = props.segment.data.qq
  const name = props.segment.data.name
  if (name) return name
  return contactStore.getUserName(Number(id), props.groupId)
})

// 处理点击事件
const handleClick = () => {
  if (props.segment.data.qq === 'all' || !props.onInsertMention) return
  const id = String(props.segment.data.qq)
  props.onInsertMention(id, displayName.value)
}
</script>
