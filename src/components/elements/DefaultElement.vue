<template>
  <div class="w-full max-w-[384px] text-xs overflow-hidden first:rounded-t-lg last:rounded-b-lg -mb-px last:mb-0 relative">
    <div class="grid grid-cols-[1.5rem_minmax(2rem,5rem)_1fr]">
      <!-- 类型标识 -->
      <div
        class="row-span-full ui-flex-center font-bold text-foreground-dim/80 tracking-wider [writing-mode:vertical-lr] rotate-180"
        :style="{ gridRow: `span ${Math.max(items.length, 1)}` }"
      >
        {{ segment.type.toUpperCase() }}
      </div>
      <template v-for="item in items" :key="item.key">
        <!-- Key 列 -->
        <div
          class="p-1 font-mono text-foreground-sub flex items-center truncate"
          :title="item.key"
        >
          {{ item.key }}
        </div>
        <!-- Value 列 -->
        <div
          class="p-1 font-mono text-foreground-main break-all cursor-pointer"
          @click="copy(item.fullValue)"
        >
          <span v-html="item.displayValue" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import type { Segment } from '@/types'

// 定义组件属性
const props = defineProps<{ segment: Segment }>()
const toast = useToast()

// 计算显示数据
const items = computed(() => {
  const data = props.segment.data
  if (!data || Object.keys(data).length === 0) return []
  return Object.entries(data).map(([key, value]) => {
    const fullValue = (value !== null && typeof value === 'object') ? JSON.stringify(value) : String(value)
    const displayValue = fullValue.length > 64 ? fullValue.slice(0, 64) + '<span">...</span>' : fullValue
    return { key, fullValue, displayValue }
  })
})

// 处理复制
const copy = (text: string) => {
  if (!text) return
  navigator.clipboard.writeText(text)
  toast.add({ severity: 'success', summary: '已复制', life: 3000 })
}
</script>
