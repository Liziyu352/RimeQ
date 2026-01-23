<template>
  <div class="w-full max-w-sm">
    <div
      class="flex flex-col h-full ui-bg-background-sub overflow-hidden ui-trans group"
      :class="{ 'cursor-pointer': !!url }"
      @click="jump"
    >
      <!-- 顶部预览图 -->
      <div
        v-if="preview && !imageFailed"
        class="relative w-full ui-flex-center overflow-hidden"
      >
        <img
          :src="preview"
          class="w-full h-full object-contain"
          referrerpolicy="no-referrer"
          loading="lazy"
          @error="imageFailed = true"
        />
      </div>
      <!-- 核心信息 -->
      <div class="flex flex-col flex-1 p-3 gap-1">
        <span class="font-bold text-sm ui-text-foreground-main line-clamp-2 leading-snug">
          {{ title }}
        </span>
        <span v-if="desc" class="text-xs ui-text-foreground-sub line-clamp-3 leading-normal">
          {{ desc }}
        </span>
      </div>
      <!-- 底部信息 -->
      <div class="ui-flex-x gap-2 px-3 py-2 border-t ui-border-background-dim/30">
        <div v-if="source" class="i-ri-link-m text-xs ui-text-foreground-dim" />
        <span class="text-[10px] ui-text-foreground-dim truncate">{{ source }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { XmlSegment } from '@/types'

// 定义组件属性
const props = defineProps<{ segment: XmlSegment }>()
const imageFailed = ref(false)

// 解析字符串
const meta = computed(() => {
  const result = { title: '', desc: '', preview: '', url: '', source: '' }
  const str = props.segment.data.data as string
  //提取标签内容
  const getTag = (tag: string): string => {
    const attrMatch = str.match(new RegExp(`${tag}="([^"]*)"`))
    if (attrMatch?.[1]) return attrMatch[1]
    const tagMatch = str.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))
    return tagMatch?.[1] || ''
  }
  // 提取字段
  result.title = getTag('title') || '卡片'
  result.desc = getTag('summary') || getTag('desc')
  result.preview = getTag('cover') || getTag('picture')
  result.url = getTag('url') || getTag('actionData')
  result.source = getTag('source') || '未知来源'

  return result
})

// 计算属性
const title = computed(() => meta.value.title)
const desc = computed(() => meta.value.desc)
const preview = computed(() => meta.value.preview)
const source = computed(() => meta.value.source)
const url = computed(() => meta.value.url)

// 打开链接
const jump = () => {
  if (url.value) window.open(url.value, '_blank', 'noopener,noreferrer')
}
</script>
