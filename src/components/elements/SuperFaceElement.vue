<template>
  <div
    ref="container"
    class="relative size-32 mx-auto pointer-events-none select-none my-1"
    :title="meta.name"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import lottie, { type AnimationItem } from 'lottie-web'
import { QFace } from '@/utils/qface'
import type { Segment, FaceSegment, DiceSegment, RpsSegment } from '@/types'

const props = defineProps<{ segment: Segment }>()
const container = ref<HTMLElement>()
let anim: AnimationItem | null = null

// 计算资源 URL 和名称
const meta = computed(() => {
  const { type, data } = props.segment

  // 1. 处理骰子
  if (type === 'dice') {
    const res = (data as DiceSegment['data']).result
    return { name: `[骰子:${res}]`, url: QFace.resolveAsset('358', Number(res)) }
  }

  // 2. 处理猜拳
  if (type === 'rps') {
    const res = (data as RpsSegment['data']).result
    return { name: '[猜拳]', url: QFace.resolveAsset('359', Number(res)) }
  }

  // 3. 处理普通 Face 里的超级表情
  if (type === 'face') {
    const id = String((data as FaceSegment['data']).id)
    const face = QFace.get(id)
    return {
      name: face ? `[${face.name}]` : '[表情]',
      url: face?.assets?.lottie || ''
    }
  }

  return { name: '', url: '' }
})

// 加载动画
const init = async () => {
  if (!container.value || !meta.value.url) return
  try {
    const animationData = await fetch(meta.value.url).then(r => r.json())

    // 防止组件已卸载后回调执行
    if (!container.value) return

    if (anim) anim.destroy()
    anim = lottie.loadAnimation({
      container: container.value,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData
    })
  } catch (e) {
    console.warn('[SuperFace] Load failed', e)
  }
}

onMounted(init)
onUnmounted(() => anim?.destroy())
// 监听 URL 变化（针对组件复用场景）
watch(() => meta.value.url, init)
</script>
