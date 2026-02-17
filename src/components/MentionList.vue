<template>
  <div
    v-show="isVisible"
    class="bg-background-sub/80 backdrop-blur-xl rounded-xl shadow-xl border border-border-main/30 overflow-hidden flex flex-col z-50 w-fit min-w-[220px] max-w-[320px] p-1.5 select-none transition-all duration-200 ease-out"
  >
    <div
      v-if="sortedItems.length"
      ref="listRef"
      class="w-full max-h-[240px] overflow-y-auto ui-scrollbar flex flex-col gap-0.5"
    >
      <button
        v-for="(item, index) in sortedItems"
        :key="item.id"
        ref="itemRefs"
        class="group relative w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-100 outline-none border-none ring-0 shrink-0"
        :class="index === selectedIndex ? 'bg-primary shadow-sm' : 'hover:bg-background-sub/50 bg-transparent'"
        @click="selectItem(index)"
        @mousemove="onHover(index)"
      >
        <!-- 头像 -->
        <div class="relative shrink-0">
          <img
            :src="item.avatar"
            class="w-8 h-8 rounded-full bg-background-sub/50 object-cover shadow-sm transition-transform duration-200"
            :class="index === selectedIndex ? 'ring-2 ring-white/30' : ''"
            loading="lazy"
            alt="avatar"
          />
        </div>
        <!-- 昵称 / 角色 -->
        <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div class="flex items-center gap-1.5 w-full">
            <span
              class="text-sm font-bold truncate transition-colors leading-none"
              :class="index === selectedIndex ? 'text-primary-content' : 'text-foreground-main'"
            >
              {{ item.label }}
            </span>
            <div v-if="item.role === 'owner' || item.role === 'admin'" class="flex gap-1 shrink-0">
              <span
                class="px-1 rounded-[4px] text-[9px] font-bold leading-none border h-3.5 flex items-center"
                :class="[
                  index === selectedIndex ? 'bg-primary-content/20 text-primary-content border-primary-content/20' : '',
                  item.role === 'owner' && index !== selectedIndex ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : '',
                  item.role === 'admin' && index !== selectedIndex ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''
                ]"
              >
                {{ item.role === 'owner' ? '群主' : '管理' }}
              </span>
            </div>
          </div>
          <!-- QQ -->
          <span
            class="text-[10px] font-mono truncate transition-colors leading-none opacity-80"
            :class="index === selectedIndex ? 'text-primary-content' : 'text-foreground-dim'"
          >
            {{ item.id }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  items: any[]
  command: (payload: any) => void
  editor?: any
}>()

// 状态管理
const selectedIndex = ref(0)
const isVisible = ref(true)
const listRef = ref<HTMLElement>()
const itemRefs = ref<HTMLElement[]>([])

// 计算属性：排序
const sortedItems = computed(() => {
  const weights: Record<string, number> = { owner: 0, admin: 1 }
  return [...props.items].sort((a, b) => (weights[a.role] ?? 2) - (weights[b.role] ?? 2))
})

// 监听列表：状态重置
watch(() => props.items, () => {
  selectedIndex.value = 0
  isVisible.value = true
  nextTick(() => listRef.value?.scrollTo({ top: 0 }))
})

// 点击外部关闭
onClickOutside(listRef, () => isVisible.value = false, {
  ignore: [props.editor?.view?.dom]
})

// 悬停更新索引
const onHover = (index: number) => {
  if (selectedIndex.value !== index) selectedIndex.value = index
}

// 确认选择
const selectItem = (index: number) => {
  const item = sortedItems.value[index]
  if (item) props.command({ id: item.id, label: item.label })
}

// 列表滚动
const scrollToView = () => {
  nextTick(() => {
    itemRefs.value[selectedIndex.value]?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  })
}

// 键盘监听
const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
  if (!isVisible.value) return false
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
      scrollToView()
    }
    return true
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (selectedIndex.value < sortedItems.value.length - 1) {
      selectedIndex.value++
      scrollToView()
    }
    return true
  }
  if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault()
    selectItem(selectedIndex.value)
    return true
  }
  if (event.key === 'Escape') {
    isVisible.value = false
    return false
  }
  return false
}

defineExpose({ onKeyDown })
</script>
