<template>
  <div class="ui-flex-col-full bg-background-sub relative">
    <!-- 顶部导航栏 -->
    <header class="h-14 shrink-0 px-3 border-b border-background-dim/50 flex items-center gap-3 z-30 bg-background-sub/95 backdrop-blur">
      <Button v-tooltip.bottom="'返回'" icon="i-ri-arrow-left-s-line" text rounded class="!w-8 !h-8 !text-foreground-sub shrink-0" @click="router.back()" />
      <div class="flex-1 min-w-0 flex items-center gap-2">
        <span class="font-bold text-base text-foreground-main truncate">选择转发目标</span>
      </div>
    </header>
    <!-- 搜索栏 -->
    <div class="shrink-0 px-3 py-2 ui-flex-x gap-2 z-10">
      <IconField class="flex-1">
        <InputIcon class="i-ri-search-line ui-text-foreground-sub text-xs" />
        <InputText
          v-model="keyword"
          placeholder="搜索好友或群聊..."
          class="w-full !h-8 !text-xs !ui-bg-background-dim/50 focus:!ui-bg-background-dim !border-transparent focus:!border-primary/50 !rounded-lg !pl-8 ui-trans"
        />
      </IconField>
    </div>
    <!-- 会话列表 -->
    <div class="flex-1 min-h-0 relative flex flex-col w-full">
      <div v-if="displayList.length === 0" class="ui-flex-y size-full text-foreground-dim opacity-60">
        <div class="i-ri-user-search-line text-4xl mb-2" />
        <span class="text-xs">未找到匹配的会话</span>
      </div>
      <VirtualScroller v-else :items="displayList" :item-size="56" class="size-full ui-scrollbar" :pt="{ content: { class: '!w-full' } }">
        <template #item="{ item }">
          <div class="px-2 py-0.5 w-full">
             <div
               class="group ui-flex-x gap-3 px-2 rounded-lg relative h-[52px] ui-trans border border-transparent select-none w-full cursor-pointer"
               :class="{ 'bg-primary/10 border-primary/20': selectedId === item.id }"
               @click="selectedId = item.id"
             >
               <Avatar :image="item.avatar" shape="circle" class="!w-9 !h-9 border ui-border-background-dim ui-bg-background-dim" />
               <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5 h-full">
                 <div class="ui-flex-x gap-1.5">
                   <span class="text-sm font-medium ui-text-foreground-main truncate">
                     {{ item.name }}
                   </span>
                 </div>
                 <div class="text-[10px] ui-flex-x gap-2 leading-none">
                   <span
                      class="text-[9px] px-1 rounded border leading-tight shrink-0"
                      :class="item.type === 'group' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20'"
                    >{{ item.type === 'group' ? '群聊' : '好友' }}</span>
                   <span class="ui-text-foreground-dim font-mono opacity-60">{{ item.id }}</span>
                 </div>
               </div>
                <div v-if="selectedId === item.id" class="absolute right-3 top-0 bottom-0 flex items-center z-10">
                   <div class="i-ri-checkbox-circle-fill text-primary text-xl" />
                </div>
             </div>
          </div>
        </template>
      </VirtualScroller>
    </div>
    <!-- 底部操作栏 -->
    <footer class="shrink-0 flex justify-end gap-3 p-3 border-t border-background-dim/50 bg-background-sub z-10">
      <Button label="取消" text severity="secondary" size="small" @click="router.back()" />
      <Button
        :label="`发送 (${count})`"
        size="small"
        class="!px-4 font-bold"
        :disabled="!selectedId || sending"
        :loading="sending"
        @click="handleSend"
      />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast, IconField, InputIcon, InputText, Avatar, Button, VirtualScroller } from 'primevue'
import { useMessageStore, useSessionStore, useContactStore } from '@/stores'
import { bot } from '@/api'
import type { Segment, NodeSegment } from '@/types'

defineOptions({ name: 'MultiForward' })

const router = useRouter()
const toast = useToast()
const messageStore = useMessageStore()
const sessionStore = useSessionStore()
const contactStore = useContactStore()

const keyword = ref('')
const selectedId = ref('')
const sending = ref(false)

const messageIds = computed(() => messageStore.selectedIds)
const count = computed(() => messageIds.value.length)

// 计算属性：会话列表
const displayList = computed(() => {
  const k = keyword.value.toLowerCase().trim()
  const list = sessionStore.sessions.map(session => {
    let name: string
    if (session.type === 'group') {
      name = contactStore.getGroupName(session.id, session.name)
    } else {
      name = contactStore.getUserName(session.id, undefined, session.name)
    }
    return { ...session, name }
  })
  if (!k) return list
  return list.filter((s) => s.name.toLowerCase().includes(k) || s.id.includes(k))
})

// 处理发送操作
const handleSend = async () => {
  if (!selectedId.value || messageIds.value.length === 0) return
  sending.value = true
  try {
    const allMsgs = messageStore.messages
    const targetMsgs = allMsgs.filter((m) => messageIds.value.includes(m.message_id))
    if (targetMsgs.length === 0) throw new Error('未找到有效消息')
    const nodes: Segment[] = targetMsgs.map((m) => ({
      type: 'node',
      data: {
        nickname: m.sender.nickname,
        user_id: m.sender.user_id,
        content: m.message
      }
    } as NodeSegment))
    const targetId = Number(selectedId.value)
    const session = sessionStore.getSession(selectedId.value)
    const isGroup = session?.type === 'group' || contactStore.checkIsGroup(selectedId.value)
    if (isGroup) {
      await bot.sendGroupForwardMsg(targetId, nodes)
    } else {
      await bot.sendPrivateForwardMsg(targetId, nodes)
    }
    toast.add({ severity: 'success', summary: '转发成功', life: 3000 })
    messageStore.setMultiSelect()
    router.back()
  } catch (e: any) {
    console.error(e)
    toast.add({ severity: 'error', summary: e.message, life: 3000 })
  } finally {
    sending.value = false
  }
}
</script>
