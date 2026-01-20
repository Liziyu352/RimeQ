<template>
  <span
    class="inline-flex items-center mx-0.5 px-1 rounded text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer transition-colors select-none font-medium text-sm align-baseline"
    @click.stop="handleClick"
  >
    @{{ displayName }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore } from '@/stores'
import type { AtSegment } from '@/types'

const props = defineProps<{
  segment: AtSegment
  groupId?: number
}>()

const emit = defineEmits<{
  (e: 'mention', item: { id: string; name: string }): void
}>()

const router = useRouter()
const contactStore = useContactStore()

const isAll = computed(() => props.segment.data.qq === 'all')

const displayName = computed(() => {
  if (isAll.value) return '全体成员'
  const id = String(props.segment.data.qq)
  const name = props.segment.data.name
  if (name) return name
  return contactStore.getUserName(id, props.groupId)
})

const handleClick = () => {
  if (isAll.value) return
  const id = String(props.segment.data.qq)
  // 如果在群聊中点击，可以触发“拍一拍”或跳转资料，这里演示发射事件让父组件处理（例如插入输入框）
  emit('mention', { id, name: displayName.value })
  // 或者跳转路由: router.push(`/${id}`)
}
</script>
