<template>
  <div class="ui-flex-col-full bg-background-sub relative">
    <!-- 头部 -->
    <header class="h-14 shrink-0 px-4 border-b border-background-dim/50 flex items-center gap-3">
      <Button
        icon="i-ri-arrow-right-s-line"
        text rounded
        class="md:hidden !w-8 !h-8 !text-foreground-sub"
        @click="router.back()"
      />
      <span class="font-bold text-base text-foreground-main">精华消息</span>
    </header>

    <!-- 列表区域 -->
    <div class="flex-1 overflow-y-auto ui-scrollbar p-3">
      <div v-if="loading" class="flex-center py-20 text-foreground-sub gap-2">
        <div class="i-ri-loader-4-line animate-spin text-xl" />
        <span class="text-sm">加载中...</span>
      </div>

      <div v-else-if="items.length === 0" class="flex-col flex-center py-20 text-foreground-dim opacity-60">
        <div class="i-ri-star-off-line text-4xl mb-2" />
        <span class="text-sm">暂无精华</span>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="item in items"
          :key="item.msg_id"
          class="bg-background-main border border-background-dim rounded-2xl p-3 shadow-sm hover:shadow-md ui-trans cursor-pointer flex flex-col gap-2"
          @click="jumpToMessage(item.msg_id)"
        >
          <!-- 发送者 -->
          <div class="flex items-center gap-2">
            <Avatar
              :image="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.sender_id}`"
              shape="circle"
              class="!w-6 !h-6 bg-background-dim"
            />
            <span class="text-xs font-bold text-foreground-main">{{ item.sender_nick }}</span>
            <span class="text-[10px] text-foreground-dim ml-auto">{{ formatTime(item.msg_time * 1000) }}</span>
          </div>

          <!-- 消息预览 (简单的文本解析) -->
          <div class="text-sm text-foreground-sub line-clamp-4 bg-background-dim/20 rounded-lg p-2">
             {{ parseContent(item.msg_content) }}
          </div>

          <!-- 底部操作人 -->
          <div class="flex items-center justify-end gap-1 mt-1 text-[10px] text-foreground-dim opacity-70">
            <div class="i-ri-star-fill text-yellow-500" />
            <span>由 {{ item.operator_nick }} 设置</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button, Avatar, useToast } from 'primevue'
import { bot } from '@/api'
import { formatTime } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const groupId = computed(() => Number(route.params.id))
const loading = ref(false)
const items = ref<any[]>([])

const parseContent = (content: any[]) => {
  if (!Array.isArray(content)) return '[未知消息]'
  return content.map(c => {
    if (c.type === 'text') return c.data.text
    if (c.type === 'image') return '[图片]'
    if (c.type === 'face') return '[表情]'
    if (c.type === 'at') return `@${c.data.name || c.data.qq}`
    return '[其他]'
  }).join('')
}

const jumpToMessage = (msgId: number) => {
  // 这里未来可以集成 MessageStore 的跳转逻辑
  console.log('Jump to message:', msgId)
  toast.add({ severity: 'info', summary: '提示', detail: '暂不支持跳转到历史消息上下文', life: 2000 })
}

onMounted(async () => {
  if (!groupId.value) return
  loading.value = true
  try {
    const res = await bot.getEssenceMsgList(groupId.value)
    items.value = res || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
