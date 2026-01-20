<template>
  <div class="inline-flex items-center gap-1 mx-1 align-middle select-none">
    <div
      class="w-8 h-8 rounded-lg bg-background-dim/50 border border-background-dim flex items-center justify-center text-2xl shadow-sm"
      :title="label"
    >
      {{ icon }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiceSegment, RpsSegment } from '@/types'

const props = defineProps<{ segment: DiceSegment | RpsSegment }>()

const isDice = computed(() => props.segment.type === 'dice')

const label = computed(() => isDice.value ? '骰子' : '猜拳')

const icon = computed(() => {
  const res = String(props.segment.data.result)
  if (isDice.value) {
    const map: Record<string, string> = { '1': '⚀', '2': '⚁', '3': '⚂', '4': '⚃', '5': '⚄', '6': '⚅' }
    return map[res] || '🎲'
  } else {
    // 1:石头 2:剪刀 3:布 (OneBot 标准可能不同，这里按常见映射)
    const map: Record<string, string> = { '1': '✊', '2': '✌', '3': '🖐' }
    return map[res] || '✊'
  }
})
</script>
