<template>
  <div class="relative w-full ui-flex-center overflow-hidden rounded-lg min-h-32 min-w-32 group">
    <video
      v-if="!videoFailed"
      :key="currentUrl"
      :src="currentUrl"
      :poster="posterUrl"
      controls
      preload="metadata"
      class="block w-full max-h-64 object-contain"
      referrerpolicy="no-referrer"
      @error="onError"
    />
    <div v-else class="ui-flex-y size-full opacity-50 gap-1 p-4">
      <div class="i-ri-vidicon-line text-4xl" />
      <span class="text-xs">视频加载失败</span>
    </div>
    <div v-if="!videoFailed" class="absolute inset-0 ui-flex-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
      <div class="i-ri-play-circle-line text-4xl" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { refreshUrl } from '@/utils/rkey'
import { type VideoSegment } from '@/types'

// 定义组件属性
const props = defineProps<{
  segment: VideoSegment
  groupId?: number
}>()
const videoFailed = ref(false)

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
    const type = props.groupId ? 'group' : 'private'
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
