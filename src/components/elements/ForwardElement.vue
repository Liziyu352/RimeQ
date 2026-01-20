<template>
  <div class="my-1 w-full max-w-sm">
    <div class="flex flex-col bg-background-sub rounded-xl border border-background-dim/60 shadow-sm overflow-hidden cursor-pointer hover:bg-background-dim/20 transition-colors">
      <!-- 标题 -->
      <div class="px-3 py-2 border-b border-background-dim/50 bg-primary/5">
        <span class="text-xs font-bold text-foreground-main truncate block">{{ summary }}</span>
      </div>
      <!-- 列表预览 -->
      <div class="p-3 flex flex-col gap-1.5">
        <div v-for="(line, i) in previewList" :key="i" class="text-xs text-foreground-sub truncate flex gap-1">
          <span class="font-medium shrink-0">{{ line.name }}:</span>
          <span class="opacity-80 truncate">{{ line.text }}</span>
        </div>
        <div v-if="previewList.length === 0" class="text-xs text-foreground-dim italic">
          暂无预览
        </div>
      </div>
      <!-- 底部统计 -->
      <div class="px-3 py-1.5 bg-background-dim/20 text-[10px] text-foreground-dim flex justify-between items-center border-t border-background-dim/30">
        <span>聊天记录</span>
        <span v-if="count > 0">共 {{ count }} 条</span>
      </div>
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
    // 兼容 node 结构和 message 结构
    const sender = node.sender?.nickname || node.data?.nickname || node.data?.name || '未知'
    const content = node.message || node.content || node.data?.content || []
    const text = Array.isArray(content) ? getTextPreview(content) : String(content)
    return { name: sender, text }
  })
})
</script>
