<template>
  <span
    class="text-primary font-medium hover:underline cursor-pointer select-none"
    @click.stop="handleClick"
  >
    @{{ displayName }}
  </span>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useContactStore } from '@/stores'
import { ChatCtxKey, MsgCtxKey, type AtSegment } from '@/types'

// 组件属性定义
const props = defineProps<{ segment: AtSegment }>()

// 依赖注入
const contactStore = useContactStore()
const msgCtx = inject(MsgCtxKey)!
const chatCtx = inject(ChatCtxKey)!

// 计算属性：是否为 @全体成员
const isAll = computed(() => props.segment.data.qq === 'all')

// 计算属性：显示名称
const displayName = computed(() => {
  if (isAll.value) return '全体成员'
  const id = String(props.segment.data.qq)
  const name = props.segment.data.name
  if (name) return name
  return contactStore.getUserName(id, msgCtx.value.groupId)
})

// 处理点击事件
const handleClick = () => {
  if (isAll.value) return
  const id = String(props.segment.data.qq)
  chatCtx.onInsertMention(id, displayName.value)
}
</script>
