<template>
  <div class="my-1 w-full max-w-sm">
    <div
      class="flex flex-col rounded-xl border ui-border-background-dim/60 ui-bg-background-sub shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 ui-trans cursor-pointer group"
      @click="jump"
    >
      <!-- 头部 -->
      <div class="ui-flex-x gap-2 px-3 py-2.5 border-b ui-border-background-dim/30 bg-background-dim/5">
        <div v-if="icon" class="size-5 rounded-full overflow-hidden shrink-0 bg-white">
          <img :src="icon" class="size-full object-cover" referrerpolicy="no-referrer" />
        </div>
        <div v-else class="size-5 rounded-full bg-primary/20 ui-flex-center shrink-0">
          <div class="i-ri-share-line text-xs text-primary" />
        </div>
        <span class="text-xs font-bold ui-text-foreground-main truncate flex-1">{{ title }}</span>
      </div>

      <!-- 内容区 -->
      <div class="p-3 flex gap-3">
        <div class="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <span class="text-xs ui-text-foreground-sub line-clamp-3 leading-relaxed break-all">
            {{ desc }}
          </span>
        </div>
        <div v-if="preview" class="size-16 rounded-lg bg-background-dim/30 overflow-hidden shrink-0 border ui-border-background-dim/20">
          <img :src="preview" class="size-full object-cover" referrerpolicy="no-referrer" />
        </div>
      </div>

      <!-- 脚注 -->
      <div v-if="source" class="px-3 py-1.5 bg-background-dim/10 text-[10px] ui-text-foreground-dim ui-flex-x gap-1">
        <div class="i-ri-link-m" />
        <span class="truncate">{{ source }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { JsonSegment, XmlSegment } from '@/types'

const props = defineProps<{ segment: JsonSegment | XmlSegment }>()

const meta = computed(() => {
  const { type, data } = props.segment
  const raw = data.data
  const result = { title: '卡片消息', desc: '点击查看详情', preview: '', icon: '', url: '', source: '' }

  if (type === 'json') {
    try {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (obj.desc === '群公告') return { ...result, title: '群公告', desc: obj.prompt, source: '公告' }
      const metaData = obj.meta ? Object.values(obj.meta)[0] as any : null
      if (metaData) {
        result.title = metaData.title || obj.prompt || obj.app || result.title
        result.desc = metaData.desc || result.desc
        result.preview = metaData.preview || metaData.cover || metaData.icon || ''
        result.url = metaData.jumpUrl || metaData.qqdocurl || metaData.url || ''
        result.source = metaData.source || obj.app || ''
        result.icon = metaData.source_icon || ''
      }
    } catch { result.desc = 'JSON 解析失败' }
  } else {
    const str = raw as string
    const getTag = (tag: string) => str.match(new RegExp(`${tag}="([^"]*)"`))?.[1] || str.match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1] || ''
    result.title = getTag('title') || 'XML 卡片'
    result.desc = getTag('summary') || getTag('desc') || result.desc
    result.preview = getTag('cover') || getTag('picture') || ''
    result.url = getTag('url') || getTag('actionData') || ''
    result.source = getTag('source')
  }
  return result
})

const title = computed(() => meta.value.title)
const desc = computed(() => meta.value.desc)
const preview = computed(() => meta.value.preview)
const icon = computed(() => meta.value.icon)
const source = computed(() => meta.value.source)

const jump = () => { if (meta.value.url) window.open(meta.value.url, '_blank') }
</script>
