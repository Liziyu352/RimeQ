<template>
  <div
    class="ui-flex-x gap-3 p-3 w-fit max-w-sm rounded-xl border ui-border-background-dim ui-bg-background-sub hover:ui-bg-background-dim/30 ui-trans cursor-pointer select-none group shadow-sm"
    title="语音消息"
  >
    <div class="size-8 rounded-full bg-primary/10 ui-flex-center group-hover:scale-110 ui-trans">
      <div class="i-ri-voiceprint-line text-lg text-primary" />
    </div>
    <div class="flex flex-col">
      <span class="text-xs font-medium ui-text-foreground-main">语音消息</span>
      <span class="text-[10px] ui-text-foreground-dim">点击播放</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecordSegment } from '@/types'
defineProps<{ segment: RecordSegment }>()
</script>
