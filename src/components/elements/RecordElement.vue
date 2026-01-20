<template>
  <div
    class="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-sub hover:bg-background-dim/50 border border-background-dim cursor-pointer transition-all select-none w-fit group shadow-sm"
    title="语音消息 (功能未实现)"
  >
    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
      <div class="i-ri-voiceprint-line text-lg text-primary" />
    </div>
    <div class="flex flex-col">
      <span class="text-xs font-medium text-foreground-main">语音消息</span>
      <span class="text-[10px] text-foreground-dim">点击播放</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecordSegment } from '@/types'
defineProps<{ segment: RecordSegment }>()
// TODO: 实现音频播放逻辑
</script>
