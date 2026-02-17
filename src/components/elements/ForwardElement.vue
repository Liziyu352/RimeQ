<template>
  <div class="max-w-96 flex flex-col backdrop-blur-md overflow-hidden rounded-xl select-text ui-trans ui-dur-normal">
    <!-- 标题 -->
    <div
      class="px-4 py-2.5 ui-flex-between ui-ia bg-foreground-main/5"
      @click="toggleExpand"
    >
      <div class="text-xs font-bold ui-flex-x">
        <span>聊天记录</span>
        <span v-if="count" class="text-[10px] font-normal opacity-60 px-1.5 rounded-sm ml-2">{{ count }}条</span>
      </div>
    </div>
    <!-- 内容 -->
    <div class="relative">
      <!-- 详细列表 -->
      <div v-if="isExpanded" class="max-h-80 overflow-y-auto ui-scrollbar p-3 flex flex-col gap-3">
        <div v-for="msg in fullMessages" :key="msg.message_id" class="flex gap-2.5 items-start">
          <Avatar
            shape="circle"
            :image="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${msg.sender.user_id}`"
            class="size-8 shrink-0"
          />
          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <div class="ui-flex-between items-baseline leading-none">
              <span class="text-xs font-bold opacity-80">{{ msg.sender.card || msg.sender.nickname }}</span>
            </div>
            <div class="text-sm break-words leading-relaxed">
              <ElementRenderer :segments="msg.message" />
            </div>
          </div>
        </div>
      </div>
      <!-- 预览列表 -->
      <div v-else class="p-3 flex flex-col gap-1">
        <template v-if="previewList.length > 0">
          <div v-for="(line, i) in previewList" :key="i" class="text-xs ui-flex-x gap-2 opacity-80">
            <span class="font-medium shrink-0 max-w-[5em] truncate">{{ line.name }}:</span>
            <span class="opacity-80 flex-1 min-w-0 truncate">{{ line.text }}</span>
          </div>
        </template>
        <div v-else class="text-xs opacity-40 italic">点击查看详情</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
import { Avatar, useToast } from 'primevue'
import { bot } from '@/api'
import { getTextPreview } from '@/utils/format'
import ElementRenderer from '@/components/ElementRenderer.vue'
import type { ForwardSegment, Message } from '@/types'

const props = defineProps<{ segment: ForwardSegment }>()
const toast = useToast()

const isExpanded = ref(false)
const fullMessages = shallowRef<Message[]>([])

// 解析数据
const data = computed(() => props.segment.data as any)
const nodes = computed(() => data.value.content)
const count = computed(() => nodes.value?.length || 0)

// 预览列表
const previewList = computed(() => {
  if (!nodes.value) return []
  return nodes.value.slice(0, 4).map((node: any) => ({
    name: node.sender?.nickname || node.data?.nickname || node.data?.name,
    text: Array.isArray(node.message || node.content) ? getTextPreview(node.message || node.content) : String(node.message || node.content)
  }))
})

// 切换展开
const toggleExpand = async () => {
  if (isExpanded.value) {
    isExpanded.value = false
    return
  }

  // 读取内容
  if (nodes.value && nodes.value.length > 0 && nodes.value[0]?.post_type === 'message') {
    fullMessages.value = nodes.value
    isExpanded.value = true
    return
  }

  // 请求 API
  try {
    const res = await bot.getForwardMsg(props.segment.data.id)
    fullMessages.value = (res as any)?.messages || []
    isExpanded.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: '加载合并转发失败', detail: e, life: 3000 })
  }
}
</script>
