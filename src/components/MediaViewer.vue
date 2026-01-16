<template>
  <transition name="fade">
    <div
      v-if="show"
      class="absolute inset-0 z-[50] bg-black/90 flex flex-col overflow-hidden"
      @click.self="close"
      @wheel.prevent="handleWheel"
    >
      <!-- 顶部工具栏 -->
      <div class="h-16 flex-between px-6 text-white bg-black/50 absolute top-0 left-0 right-0 z-10">
        <span v-if="!isVideo" class="text-sm opacity-80">{{ scale.toFixed(0) }}%</span>
        <div class="flex-x gap-6 text-xl">
          <!-- 旋转按钮仅对图片显示 -->
          <template v-if="!isVideo">
            <div class="i-ri-arrow-go-back-line cursor-pointer hover:text-primary" @click="rotate(-90)" />
            <div class="i-ri-arrow-go-forward-line cursor-pointer hover:text-primary" @click="rotate(90)" />
          </template>
          <div class="i-ri-download-line cursor-pointer hover:text-primary" @click="download" />
          <div class="i-ri-close-line cursor-pointer hover:text-primary text-2xl" @click="close" />
        </div>
      </div>

      <!-- 媒体显示区 -->
      <div
        class="flex-1 w-full h-full flex-center"
        :class="{ 'cursor-move': !isVideo }"
        @mousedown="!isVideo && startDrag($event)"
        @mousemove="!isVideo && onDrag($event)"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
      >
        <!-- 视频播放器 -->
        <video
          v-if="isVideo"
          :src="src"
          controls
          autoplay
          class="max-w-full max-h-full"
          referrerpolicy="no-referrer"
        />
        <!-- 图片查看器 (修复防盗链) -->
        <img
          v-else
          ref="imgRef"
          :src="src"
          class="transition-transform duration-100 ease-linear select-none max-w-none max-h-none"
          :style="imgStyle"
          draggable="false"
          referrerpolicy="no-referrer"
        />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  src: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 新增：判断是否为视频
const isVideo = computed(() => props.src.toLowerCase().endsWith('.mp4'))

// 状态
const scale = ref(100)
const rotation = ref(0)
const translate = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 样式计算
const imgStyle = computed(() => ({
  transform: `translate(${translate.value.x}px, ${translate.value.y}px) rotate(${rotation.value}deg) scale(${scale.value / 100})`
}))

// 初始化/重置
watch(show, (val) => {
  if (val) {
    scale.value = 100
    rotation.value = 0
    translate.value = { x: 0, y: 0 }
  }
})

// 方法
const close = () => { show.value = false }
const rotate = (deg: number) => { rotation.value += deg }
const handleWheel = (e: WheelEvent) => {
  if (isVideo.value) return // 视频不支持缩放
  const delta = e.deltaY > 0 ? -10 : 10
  const newScale = Math.max(10, Math.min(500, scale.value + delta))
  scale.value = newScale
}

const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  dragStart.value = { x: e.clientX - translate.value.x, y: e.clientY - translate.value.y }
}
const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  translate.value = { x: e.clientX - dragStart.value.x, y: e.clientY - dragStart.value.y }
}
const stopDrag = () => { isDragging.value = false }
const download = () => {
  const a = document.createElement('a')
  a.href = props.src
  a.download = props.src.split('/').pop() || (isVideo.value ? 'video.mp4' : 'image.png')
  a.click()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
