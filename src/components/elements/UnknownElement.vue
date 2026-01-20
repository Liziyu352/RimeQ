<template>
  <span class="text-xs text-foreground-dim bg-background-dim/30 px-1 rounded mx-0.5 select-none cursor-help" :title="JSON.stringify(segment)">
    [{{ segment.type }}]
  </span>
</template>

<script setup lang="ts">
import type { Segment } from '@/types'
defineProps<{ segment: Segment }>()
</script>
