<template>
  <span
    class="inline-flex items-center mx-0.5 px-1 rounded text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 ui-trans select-none align-baseline cursor-pointer"
    @click.stop="handleClick"
  >
    @{{ displayName }}
  </span>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useContactStore } from '@/stores'
import { ChatCtxKey, MsgCtxKey, type AtSegment } from '@/types'

const props = defineProps<{ segment: AtSegment }>()

const contactStore = useContactStore()
const msgCtx = inject(MsgCtxKey)!
const chatCtx = inject(ChatCtxKey)!

const isAll = computed(() => props.segment.data.qq === 'all')

const displayName = computed(() => {
  if (isAll.value) return '全体成员'
  const id = String(props.segment.data.qq)
  const name = props.segment.data.name
  if (name) return name
  return contactStore.getUserName(id, msgCtx.value.groupId)
})

const handleClick = () => {
  if (isAll.value) return
  const id = String(props.segment.data.qq)
  chatCtx.onInsertMention(id, displayName.value)
}
</script>
