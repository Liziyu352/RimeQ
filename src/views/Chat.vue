<template>
  <div class="ui-flex-col-full relative overflow-hidden bg-transparent">
    <!-- 主体区域 -->
    <main class="ui-flex-col-full min-w-0 relative">
      <!-- 空状态 -->
      <div v-if="!id" class="ui-flex-y size-full ui-text-foreground-dim select-none pb-20">
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 ui-flex-center shadow-lg mb-6 text-white">
          <div class="i-ri-chat-smile-2-fill text-5xl drop-shadow-md" />
        </div>
        <h2 class="text-xl font-bold ui-text-foreground-main mb-2 tracking-wide">RimeQ</h2>
        <p class="text-xs opacity-60">选择联系人开始聊天</p>
      </div>
      <!-- 活跃会话区域 -->
      <div v-else class="ui-flex-col-full relative">
        <!-- 消息列表滚动区 -->
        <div
          id="msgPan"
          ref="scrollRef"
          class="flex-1 overflow-y-auto px-3 md:px-4 ui-scrollbar relative"
          @scroll="onScroll"
        >
          <!-- 消息流容器 -->
          <div class="flex flex-col gap-3 pb-4 pt-4 relative" style="overflow-anchor: auto">
            <MsgBubble
              v-for="(msg, index) in list"
              :key="msg.message_id || index"
              :msg="msg"
              :selection-mode="messageStore.isMultiSelect"
              :is-selected="messageStore.selectedIds.includes(msg.message_id)"
              :force-markdown="markdownId.has(msg.message_id)"
              :show-raw="rawJsonId.has(msg.message_id)"
            />
            <!-- 底部按钮检测 -->
            <div
              ref="bottomRef"
              class="absolute bottom-0 left-0 w-full h-[256px] pointer-events-none opacity-0"
            />
          </div>
        </div>
        <!-- 回到底部按钮 -->
        <div
          v-if="showScroll"
          class="absolute bottom-20 right-6 z-20 cursor-pointer bg-primary text-primary-content text-xs px-3 py-2 rounded-full shadow-lg hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-1 select-none"
          @click="scrollToBottom(true)"
        >
          <div class="i-ri-arrow-down-double-line" />
          <span v-if="newMsgCount > 0" class="font-bold">{{ newMsgCount }}</span>
        </div>
        <!-- 底部输入区域 -->
        <ChatInput
          ref="chatInputRef"
          :chat-id="id"
          :is-group="isGroup"
          @send="scrollToBottom(true)"
        />
        <!-- 右键菜单 -->
        <ContextMenu
          ref="contextMenu"
          :model="menuItems"
          :pt="{ root: { class: '!min-w-[128px] w-auto' } }"
        >
          <template #item="{ item, props }">
            <a
              v-bind="props.action"
              class="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors group"
              :class="item.class || 'text-foreground-main hover:bg-primary/10 hover:text-primary'"
            >
              <span
                v-if="item.icon"
                :class="[item.icon, 'text-base opacity-80 shrink-0 group-hover:opacity-100']"
              />
              <span class="whitespace-nowrap text-sm font-medium flex-1">
                {{ item.label }}
              </span>
              <span v-if="item.items" class="i-ri-arrow-right-s-line text-base opacity-50 ml-auto" />
            </a>
          </template>
        </ContextMenu>
        <!-- 禁言设置弹窗 -->
        <Dialog v-model:visible="banDialog.visible" modal header="禁言时长" :style="{ width: '22rem' }">
          <div class="flex flex-col gap-4 py-2">
            <!-- 时间选择器 -->
            <div class="flex items-center justify-between gap-2">
              <InputNumber v-model="banForm.d" :min="0" :max="30" show-buttons button-layout="vertical" suffix=" 天" input-class="!text-center !text-sm !p-1 w-full" class="flex-1" />
              <InputNumber v-model="banForm.h" :min="0" :max="23" show-buttons button-layout="vertical" suffix=" 时" input-class="!text-center !text-sm !p-1 w-full" class="flex-1" />
              <InputNumber v-model="banForm.m" :min="0" :max="59" show-buttons button-layout="vertical" suffix=" 分" input-class="!text-center !text-sm !p-1 w-full" class="flex-1" />
              <InputNumber v-model="banForm.s" :min="0" :max="59" show-buttons button-layout="vertical" suffix=" 秒" input-class="!text-center !text-sm !p-1 w-full" class="flex-1" />
            </div>
            <!-- 操作按钮 -->
            <div class="flex gap-2">
               <Button label="解除" severity="success" outlined class="flex-1 !text-xs" @click="executeBan(0)" />
               <Button label="禁言" class="flex-1 !text-xs" :disabled="(banForm.d * 86400 + banForm.h * 3600 + banForm.m * 60 + banForm.s) === 0" @click="executeBan()" />
            </div>
          </div>
        </Dialog>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, reactive, provide } from 'vue'
import { useRoute } from 'vue-router'
import { ContextMenu, useToast, Dialog, InputNumber, Button } from 'primevue'
import { useIntersectionObserver } from '@vueuse/core'

import { bot } from '@/api'
import { useMessageStore, useSessionStore, useContactStore, useSettingStore } from '@/stores'
import { getTextPreview } from '@/utils/format'
import { ChatCtxKey, type Message } from '@/types'
import MsgBubble from '@/components/MsgBubble.vue'
import ChatInput from '@/components/ChatInput.vue'

defineOptions({ name: 'ChatView' })

// 全局实例
const route = useRoute()
const toast = useToast()
const messageStore = useMessageStore()
const sessionStore = useSessionStore()
const contactStore = useContactStore()
const settingStore = useSettingStore()

// 会话上下文
const id = computed(() => (route.params.id as string) || '') // 当前会话 ID
const session = computed(() => sessionStore.getSession(id.value)) // 当前会话对象
const list = computed(() => {
  if (settingStore.config.enableAntiRecall) return messageStore.messages
  return messageStore.messages.filter(msg => !(msg as any).recalled)
}) // 当前会话消息列表
const isGroup = computed(() => !!id.value && (session.value?.type === 'group' || contactStore.checkIsGroup(id.value))) // 当前会话是否为群聊

// UI 状态
const contextMenu = ref() // 右键菜单实例
const contextMsg = ref<Message | null>(null) // 右键菜单目标消息
const markdownId = ref(new Set<number>()) // Markdown 渲染消息 ID
const rawJsonId = ref(new Set<number>()) // 原始数据渲染消息 ID
const banDialog = reactive({ visible: false, target: null as Message | null })
const banForm = reactive({ d: 0, h: 0, m: 10, s: 0 })

// DOM 引用
const scrollRef = ref<HTMLElement>() // 消息列表滚动容器
const bottomRef = ref<HTMLElement>() // 底部按钮检测容器
const chatInputRef = ref<InstanceType<typeof ChatInput>>() // 输入框组件引用

// 滚动状态
const showScroll = ref(false) // 显示回到底部按钮
const newMsgCount = ref(0) // 新消息数量

// 底部检测
useIntersectionObserver(bottomRef, ([entry]) => {
  if (!entry) return
  const isNearBottom = entry.isIntersecting
  showScroll.value = !isNearBottom
  if (isNearBottom) newMsgCount.value = 0
}, { root: scrollRef.value })

// 滚动触底
const scrollToBottom = async (smooth = true) => {
  await nextTick()
  if (scrollRef.value) {
    const el = scrollRef.value
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant'
    })
  }
}

// 滚动事件监听
const onScroll = async (e: Event) => {
  const el = e.target as HTMLElement
  if (messageStore.isLoading || list.value.length === 0) return
  if (el.scrollTop < 512 && id.value) await messageStore.fetchHistory(id.value)
}

// 生命周期监听
watch(() => id.value, (newId) => {
  if (newId) {
    messageStore.openSession(newId)
    markdownId.value.clear()
    rawJsonId.value.clear()
    if (isGroup.value) contactStore.fetchGroupMembers(Number(newId))
  }
}, { immediate: true })

// 消息列表监听
watch(() => list.value, async (newVal, oldVal) => {
  const newLen = newVal.length
  const oldLen = oldVal?.length || 0
  if (newLen <= oldLen) return
  if (oldLen === 0) return
  const newLastId = newVal[newLen - 1]?.message_id
  const oldLastId = oldVal?.[oldLen - 1]?.message_id
  if (newLastId === oldLastId) return
  const lastMsg = newVal[newLen - 1]
  const isMe = lastMsg?.sender.user_id === settingStore.user?.user_id
  if (isMe || !showScroll.value) {
    await scrollToBottom(true)
  } else {
    newMsgCount.value += (newLen - oldLen)
  }
})

// 发送戳一戳
const onPoke = (uid: number) => bot.sendPoke(uid, isGroup.value ? Number(id.value) : undefined)

// 插入提及
const onInsertMention = (mid: string, name: string) => {
  if (chatInputRef.value) chatInputRef.value.insertMention(mid, name)
}

// 点击右键菜单
const onContextMenu = (e: MouseEvent, msg: Message) => {
  if (messageStore.isMultiSelect) return
  contextMsg.value = msg
  contextMenu.value.show(e)
}

// 定义交互方法
const chatCtx = {
  onInsertMention,
  onPoke,
  onContextMenu,
  onToggleSelect: (messageId: number) => {
    messageStore.setMultiSelect(messageId)
  },
  onReply: (msg: Message) => {
    messageStore.setReplyTarget(msg)
    chatInputRef.value?.focus()
  }
}

// 注入交互方法
provide(ChatCtxKey, chatCtx)

// 打开禁言弹窗
const openBanDialog = (msg: Message) => {
  banDialog.target = msg
  banForm.d = 0; banForm.h = 0; banForm.m = 10; banForm.s = 0;
  banDialog.visible = true
}

// 执行禁言
const executeBan = async (duration?: number) => {
  if (!banDialog.target || !banDialog.target.group_id) return
  const finalDuration = duration ?? (banForm.d * 86400 + banForm.h * 3600 + banForm.m * 60 + banForm.s)
  try {
    await bot.setGroupBan(banDialog.target.group_id, banDialog.target.sender.user_id, finalDuration)
    toast.add({ severity: 'success', summary: finalDuration === 0 ? '已解禁' : '已禁言', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: '操作失败', detail: String(e), life: 3000 })
  }
  banDialog.visible = false
}
// 菜单选项
const menuItems = computed(() => {
  const m = contextMsg.value
  if (!m) return []
  const myRole = m.message_type === 'group' ? contactStore.members.get(Number(id.value))?.find(u => u.user_id === settingStore.user?.user_id)?.role || 'member' : 'owner'
  // 基础菜单
  const items: any[] = [
    { label: '+1', icon: 'i-ri-add-circle-line', command: () => bot.sendMsg(m.message_type, m.message_type === 'group' ? m.group_id! : m.user_id, m.message)},
    { label: '引用', icon: 'i-ri-reply-line', command: () => chatCtx.onReply(m) },
    { label: '转发', icon: 'i-ri-share-forward-line', command: () => chatCtx.onToggleSelect(m.message_id) },
  ]
  // 工具子菜单
  const toolMenu: any[] = []
  toolMenu.push({ label: '戳一戳', icon: 'i-ri-magic-line', command: () => onPoke(m.sender.user_id) })
  if (m.message.some(s => s.type === 'record')) {
    toolMenu.push({
      label: '转文字', icon: 'i-ri-voice-recognition-line',
      command: async () => {
        try {
          const res = await bot.voiceMsgToText(m.message_id)
          if (res.text) toast.add({ severity: 'info', summary: '转文字结果', detail: res.text, life: 5000 })
        } catch (e) {
          toast.add({ severity: 'error', summary: '转文字失败', detail: String(e), life: 3000 })
        }
      }
    })
  }
  toolMenu.push({
    label: '复制', icon: 'i-ri-file-copy-line',
    command: () => {
      navigator.clipboard.writeText(getTextPreview(m.message))
      toast.add({ severity: 'success', summary: '已复制', life: 3000 })
    }
  })
  if (bot.backend === 'NapCat') {
    toolMenu.push({
      label: '收藏', icon: 'i-ri-star-line',
      command: () => {
        bot.createCollection(JSON.stringify(m.message), getTextPreview(m.message))
        toast.add({ severity: 'success', summary: '已收藏', life: 3000 })
      }
    })
  }
  const imgSeg = m.message.find(s => s.type === 'image')
  if (imgSeg?.data?.url) {
    toolMenu.push({
      label: '另存为', icon: 'i-ri-download-2-line',
      command: () => {
        const a = document.createElement('a')
        a.href = imgSeg.data.url!; a.download = `image_${m.message_id}`; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    })
  }
  toolMenu.push({
      label: 'Markdown', icon: markdownId.value.has(m.message_id) ? 'i-ri-markdown-fill' : 'i-ri-markdown-line',
      command: () => markdownId.value.has(m.message_id) ? markdownId.value.delete(m.message_id) : markdownId.value.add(m.message_id)
  })
  // 管理子菜单
  const manageMenu: any[] = []
  if (m.sender.user_id === settingStore.user?.user_id || myRole !== 'member') {
    manageMenu.push({ label: '撤回', icon: 'i-ri-arrow-go-back-line', command: () => bot.deleteMsg(m.message_id) })
  }
  if (m.message_type === 'group' && myRole !== 'member') {
    if (!(m.sender.user_id === settingStore.user?.user_id)) {
      manageMenu.push({ label: '禁言', icon: 'i-ri-chat-off-line', command: () => openBanDialog(m) })
    }
    manageMenu.push({ label: '设为精华', icon: 'i-ri-star-line', command: () => bot.setEssenceMsg(m.message_id) })
  }
  manageMenu.push({
    label: 'Raw Json', icon: rawJsonId.value.has(m.message_id) ? 'i-ri-code-s-slash-fill' : 'i-ri-code-s-slash-line',
    command: () => rawJsonId.value.has(m.message_id) ? rawJsonId.value.delete(m.message_id) : rawJsonId.value.add(m.message_id)
  })
  // 整合菜单
  if (toolMenu.length > 0 || manageMenu.length > 0) items.push({ separator: true })
  if (toolMenu.length > 0) items.push({ label: '工具', icon: 'i-ri-apps-2-line', items: toolMenu })
  if (manageMenu.length > 0) items.push({ label: '管理', icon: 'i-ri-settings-3-line', items: manageMenu })

  return items
})
</script>
