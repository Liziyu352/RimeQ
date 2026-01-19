<template>
  <!-- 图片/超级表情 (块级显示) -->
  <div
    class="inline-block my-1 rounded-lg overflow-hidden max-w-full relative group/img align-middle"
  >
    <Image
      v-if="!hasError"
      :src="imageUrl"
      preview
      image-class="max-w-full max-h-[360px] min-w-[50px] min-h-[50px] object-cover cursor-pointer ui-bg-background-dim/50 block"
      referrerpolicy="no-referrer"
      loading="lazy"
      @error="hasError = true"
    >
      <template>
        <div class="i-ri-eye-line text-white text-xl" />
      </template>
    </Image>

    <!-- 加载失败提示 -->
    <div
      v-if="hasError"
      class="ui-abs-full ui-bg-background-dim/30 text-xs ui-text-foreground-sub ui-flex-y gap-1 p-2 text-center min-h-[80px] min-w-[80px]"
    >
      <div class="i-ri-image-off-line text-xl" />
      <span>图片加载失败</span>
      <a :href="imageUrl" target="_blank" class="ui-text-primary hover:underline text-[10px]" @click.stop>尝试打开</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Image } from 'primevue'
import type { Segment } from '@/types'

const props = defineProps<{ segment: Segment }>()
const hasError = ref(false)

const imageUrl = computed(() => {
  const { data } = props.segment

  // 处理图片类型
  if (!data) return ''
  if (data.url && data.url.startsWith('http')) return data.url
  if (data.file) {
    if (data.file.startsWith('base64://')) return 'data:image/png;base64,' + data.file.substring(9)
    else if (data.file.startsWith('http')) return data.file
    else if (data.file.length > 500 && !data.file.includes('/')) return 'data:image/png;base64,' + data.file
  }
  return ''
})

</script>
