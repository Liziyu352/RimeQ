<template>
  <div class="w-full max-w-sm">
    <div
      class="flex flex-col h-full bg-background-sub overflow-hidden ui-trans group"
      :class="{ 'cursor-pointer': !!url }"
    >
      <!-- 顶部信息 -->
      <div v-if="source" class="ui-flex-x gap-2 px-3 py-2 bg-background-dim/20">
        <div v-if="icon" class="size-4 rounded-full overflow-hidden shrink-0">
          <img :src="icon" class="size-full object-cover" referrerpolicy="no-referrer" />
        </div>
        <span class="text-[10px] text-foreground-dim truncate">{{ source }}</span>
      </div>
      <div class="flex items-start p-3 gap-3">
        <!-- 预览图 -->
        <div class="relative w-16 h-16 shrink-0 bg-background-dim/20 rounded-xl overflow-hidden group/image">
          <Image
            v-if="!imageFailed"
            :src="preview"
            preview
            image-class="size-full object-cover cursor-pointer group-hover:opacity-90"
            referrerpolicy="no-referrer"
            @error="imageFailed = true"
          />
          <!-- 播放按钮 -->
          <div
            v-if="audioUrl"
            class="absolute inset-0 bg-black/30 ui-flex-center opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer backdrop-blur-[1px]"
            @click.stop="togglePlay"
          >
            <div
              class="text-white drop-shadow-md text-2xl transition-transform active:scale-90"
              :class="isPlaying ? 'i-ri-pause-circle-fill' : 'i-ri-play-circle-fill'"
            />
          </div>
        </div>
        <!-- 文字信息 -->
        <div class="flex-1 min-w-0" @click="jump">
          <span class="font-bold text-sm text-foreground-main line-clamp-3 leading-snug">
            {{ title }}
          </span>
          <span v-if="desc" class="text-xs text-foreground-sub line-clamp-2 leading-normal mt-1 block whitespace-pre-wrap">
            {{ desc }}
          </span>
        </div>
      </div>
    </div>
    <!-- 音频播放 -->
    <audio
      ref="audioRef"
      :src="audioUrl"
      class="hidden"
      @ended="onReset"
      @error="onReset"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Image } from 'primevue'
import type { JsonSegment } from '@/types'

// 定义组件属性
const props = defineProps<{ segment: JsonSegment }>()
const imageFailed = ref(false)

// 音频控制状态
const audioRef = ref<HTMLAudioElement>()
const isPlaying = ref(false)

// 解析元数据
const meta = computed(() => {
  const result = { title: '', desc: '', preview: '', icon: '', url: '', source: '', audioUrl: '' }
  const obj = typeof props.segment.data.data === 'string' ? JSON.parse(props.segment.data.data) : props.segment.data.data
  const metaData = obj.meta ? (Object.values(obj.meta)[0] as any) : null
  switch (true) {
    // 小程序
    case obj.app?.includes('miniapp'):
      result.title = metaData?.desc || obj.prompt
      result.desc = metaData?.host?.nick ? `由 ${metaData.host.nick} 分享` : ''
      result.preview = metaData?.preview
      result.icon = metaData?.icon
      result.url = metaData?.qqdocurl || metaData?.url
      result.source = metaData?.title
      break
    // 合并转发
    case obj.app === 'com.tencent.multimsg':
      result.title = metaData?.summary || obj.prompt
      result.desc = metaData?.news?.map((n: any) => n.text).join('\n')
      result.preview = ''
      result.icon = ''
      result.url = ''
      result.source = metaData?.source || obj.prompt
      break
    // 公告
    case obj.app === 'com.tencent.mannounce':
      result.title = decodeURIComponent(escape(atob(metaData?.title)))
      result.desc = decodeURIComponent(escape(atob(metaData?.text)))
      result.preview = ''
      result.icon = ''
      result.url = `https://web.qun.qq.com/mannounce/index.html?_wv=1031&_bid=148#gc=${metaData.gc}&fid=${metaData.fid}`
      result.source = '群公告'
      break
    // 相册
    case obj.app === 'com.tencent.feed.lua':
      result.title = metaData?.title || obj.prompt
      result.desc = metaData?.forwardMessage
      result.preview = metaData?.cover
      result.icon = metaData?.tagIcon
      result.url = metaData?.pcJumpUrl || metaData?.legacyUrl || metaData?.jumpUrl
      result.source = metaData?.tagName
      break
    // 名片
    case obj.app === 'com.tencent.contact.lua':
      result.title = metaData?.nickname || obj.prompt
      result.desc = metaData?.contact
      result.preview = metaData?.avatar
      result.icon = metaData?.avatar
      result.url = metaData?.pcJumpUrl || metaData?.jumpUrl
      result.source = metaData?.tag
      break
    // 图文（收藏）
    case obj.app === 'com.tencent.tuwen.lua':
      result.title = metaData?.title
      result.desc = metaData?.desc || obj.prompt
      result.preview = metaData?.preview
      result.icon = metaData?.tagIcon
      result.url = metaData?.jumpUrl
      result.source = metaData?.tag
      break
    // 音乐
    case obj.app === 'com.tencent.music.lua':
      result.title = metaData?.title || obj.prompt
      result.desc = metaData?.desc
      result.preview = metaData?.preview
      result.icon = metaData?.tagIcon
      result.url = metaData?.jumpUrl
      result.source = metaData?.tag
      result.audioUrl = metaData?.musicUrl
      break
    // 邀请
    case obj.app === 'com.tencent.together':
      result.title = metaData?.title
      result.desc = metaData?.summary || obj.prompt
      result.preview = metaData?.cover
      result.url = ''
      result.source = metaData?.title
      break
    // 位置
    case obj.app === 'com.tencent.map':
      result.title = metaData?.name
      result.desc = metaData?.address
      result.preview = ''
      result.url = `https://map.qq.com/m/place/search?query=${encodeURIComponent(metaData?.name)}&pointx=${metaData?.lng}&pointy=${metaData?.lat}`
      result.source = '位置'
      break
    // 默认
    default:
      result.title = metaData?.title || obj.prompt
      result.desc = metaData?.desc || metaData?.summary
      result.preview = metaData?.preview || metaData?.cover
      result.icon = metaData?.icon || metaData?.tagIcon
      result.url = metaData?.qqdocurl || metaData?.jumpUrl
      result.source = metaData?.tag || metaData?.source || obj.app
      break
  }
  return result
})

// 计算属性
const title = computed(() => meta.value.title)
const desc = computed(() => meta.value.desc)
const preview = computed(() => meta.value.preview)
const icon = computed(() => meta.value.icon)
const source = computed(() => meta.value.source)
const url = computed(() => meta.value.url)
const audioUrl = computed(() => meta.value.audioUrl)

// 播放控制
const togglePlay = () => {
  const audio = audioRef.value
  if (!audio || !audioUrl.value) return
  if (isPlaying.value) {
    audio.pause()
    isPlaying.value = false
  } else {
    audio.play().catch(onReset)
    isPlaying.value = true
  }
}

// 状态重置
const onReset = () => {
  isPlaying.value = false
}

// 打开链接
const jump = () => {
  if (url.value) window.open(url.value, '_blank', 'noopener,noreferrer')
}
</script>
