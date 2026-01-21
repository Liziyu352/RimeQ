<template>
  <div class="my-1 rounded-lg border border-yellow-500/30 bg-yellow-500/5 overflow-hidden text-xs max-w-md shadow-sm">
    <div class="ui-flex-between px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
      <span class="font-bold font-mono">TYPE: {{ segment.type }}</span>
      <button class="opacity-60 hover:opacity-100 ui-trans" @click="copy">COPY</button>
    </div>
    <pre class="p-2 overflow-x-auto ui-scrollbar text-foreground-sub font-mono whitespace-pre-wrap break-all select-text">{{ json }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import type { Segment } from '@/types'

const props = defineProps<{ segment: Segment }>()
const toast = useToast()
const json = computed(() => JSON.stringify(props.segment.data, null, 2))

const copy = () => {
  navigator.clipboard.writeText(JSON.stringify(props.segment, null, 2))
  toast.add({ severity: 'info', summary: '已复制调试数据', life: 2000 })
}
</script>
