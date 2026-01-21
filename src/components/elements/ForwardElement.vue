<template>
  <div class="w-full flex flex-col bg-background-sub ui-trans cursor-pointer group overflow-hidden border ui-border-background-dim/30 rounded-lg">
    <!-- 标题栏 -->
    <div class="px-3 py-2.5 border-b ui-border-background-dim/30 bg-primary/5">
      <span class="text-xs font-bold ui-text-foreground-main truncate block">{{ summary }}</span>
    </div>

    <!-- 列表预览 -->
    <div class="p-3 flex flex-col gap-1.5 min-h-[60px] justify-center">
      <div v-for="(line, i) in previewList" :key="i" class="text-xs ui-text-foreground-sub truncate flex gap-1">
        <span class="font-medium shrink-0 opacity-80">{{ line.name }}:</span>
        <span class="opacity-70 truncate">{{ line.text }}</span>
      </div>
      <div v-if="previewList.length === 0" class="text-xs text-foreground-dim italic">
        暂无预览
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="px-3 py-2 bg-background-dim/10 text-[10px] ui-text-foreground-dim ui-flex-between border-t ui-border-background-dim/20 group-hover:bg-background-dim/20 ui-trans">
      <span>聊天记录</span>
      <span v-if="count > 0">共 {{ count }} 条</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getTextPreview } from '@/utils/format'
import type { ForwardSegment } from '@/types'

const props = defineProps<{ segment: ForwardSegment }>()
const data = computed(() => props.segment.data as any)
const summary = computed(() => data.value.summary || '群聊的聊天记录')

const messages = computed(() => {
  const content = data.value.content || data.value.nodes
  return Array.isArray(content) ? content : []
})

const count = computed(() => messages.value.length)

const previewList = computed(() => {
  return messages.value.slice(0, 4).map((node: any) => {
    const sender = node.sender?.nickname || node.data?.nickname || node.data?.name || '未知'
    const content = node.message || node.content || node.data?.content || []
    return { name: sender, text: Array.isArray(content) ? getTextPreview(content) : String(content) }
  })
})
</script>
