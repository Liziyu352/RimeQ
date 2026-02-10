<template>
  <div class="relative w-full group select-none min-h-[128px] min-w-[128px] bg-background-dim/5 flex flex-col overflow-hidden">
    <Image
      v-if="!imageFailed"
      :src="currentUrl"
      preview
      image-class="block w-full h-auto max-h-[256px] max-w-[256px] object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
      class="size-full ui-flex-center"
      referrerpolicy="no-referrer"
      loading="lazy"
      @error="onError"
    />
    <div v-else class="size-full ui-flex-center flex-col text-foreground-dim opacity-50 gap-1 p-4">
      <div class="i-ri-image-line text-4xl" />
      <span class="text-xs">图片加载失败</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, watch } from 'vue'
import { Image } from 'primevue'
import { refreshUrl } from '@/utils/rkey'
import { MsgCtxKey, type ImageSegment, type MFaceSegment } from '@/types'

// 定义组件属性
const props = defineProps<{ segment: ImageSegment | MFaceSegment }>()
const imageFailed = ref(false)

// 注入消息上下文
const msgCtx = inject(MsgCtxKey)

// 计算图片链接
const initialUrl = computed(() => {
  const d = props.segment.data
  if ('url' in d && d.url) return d.url
  if ('file' in d) {
    if (d.file.startsWith('http')) return d.file
    if (d.file.startsWith('base64://')) return `data:image/png;base64,${d.file.slice(9)}`
    return d.file
  }
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
  imageFailed.value = true
}

// 监听初始 URL 变化
watch(initialUrl, (newUrl) => {
  currentUrl.value = newUrl
  imageFailed.value = false
}, { immediate: true })
</script>
