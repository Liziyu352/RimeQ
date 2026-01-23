<template>
  <div class="relative w-full bg-black ui-flex-center group overflow-hidden rounded-lg min-h-[64px] min-w-[64px]">
    <video
      v-if="!videoFailed"
      :key="currentUrl"
      :src="currentUrl"
      :poster="posterUrl"
      controls
      preload="metadata"
      class="block w-full max-h-[400px] object-contain"
      referrerpolicy="no-referrer"
      @error="onError"
    />
    <div v-else class="size-full ui-flex-center flex-col text-foreground-dim opacity-50 gap-1 p-4">
      <div class="i-ri-vidicon-line text-4xl" />
      <span class="text-xs">视频加载失败</span>
    </div>
    <div v-if="!videoFailed" class="absolute inset-0 ui-flex-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
      <div class="i-ri-play-circle-line text-4xl text-white/80 drop-shadow-md" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { refreshUrl } from '@/utils/rkey'
import { MsgCtxKey, type VideoSegment } from '@/types'

// 定义组件属性
const props = defineProps<{ segment: VideoSegment }>()
const videoFailed = ref(false)

// 注入消息上下文
const msgCtx = inject(MsgCtxKey)

// 计算视频链接
const initialUrl = computed(() => {
  const d = props.segment.data
  if (d.url) return d.url
  if (d.file && d.file.startsWith('http')) return d.file
  return ''
})

// 计算封面图链接
const posterUrl = computed(() => {
  const d = props.segment.data
  if (d.thumb) return `data:image/jpeg;base64,${d.thumb}`
  return ''
})

// 绑定响应式 URL
const currentUrl = ref(initialUrl.value)

// 加载失败处理
const onError = async () => {
  const url = currentUrl.value
  if (url.includes('multimedia.nt.qq.com.cn')) {
    const type = msgCtx?.value.groupId ? 'group' : 'private'
    const newUrl = await refreshUrl(url, type, true)
    if (newUrl !== currentUrl.value) {
      currentUrl.value = newUrl
      return
    }
  }
  videoFailed.value = true
}

// 监听初始 URL 变化
watch(initialUrl, (newUrl) => {
  currentUrl.value = newUrl
  videoFailed.value = false
}, { immediate: true })
</script>
