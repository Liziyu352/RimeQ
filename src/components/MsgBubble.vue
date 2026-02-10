<template>
  <!-- 系统提示 -->
  <div v-if="isSystem" class="ui-flex-center w-full py-2 select-none">
    <div class="bg-background-dim text-foreground-dim text-xs px-3 py-1 rounded-full backdrop-blur-sm">
      {{ systemPreview }}
    </div>
  </div>
  <!-- 常规消息 -->
  <div
    v-else
    :id="`msg-${msg.message_id}`"
    class="flex w-full mb-3 gap-3 relative ui-trans ui-dur-normal"
    :class="[
      isMe ? 'flex-row-reverse' : 'flex-row',
      selectionMode && !isSelected ? 'opacity-50' : 'opacity-100'
    ]"
    @contextmenu.prevent="onContextMenu($event, msg)"
    @click="onBubbleClick"
  >
    <!-- 多选框 -->
    <div v-if="selectionMode" class="ui-flex-center shrink-0">
      <div
        class="size-5 rounded-full border-2 ui-flex-center ui-trans"
        :class="isSelected ? 'bg-primary border-primary' : 'border-background-dim bg-transparent'"
      >
        <div v-if="isSelected" class="i-ri-check-line text-primary-content text-xs" />
      </div>
    </div>
    <!-- 头像 -->
    <Avatar
      shape="circle"
      :image="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${msg.sender.user_id}`"
      class="size-10 shadow-sm border border-background-dim shrink-0 ui-ia bg-background-sub"
      @dblclick="onPoke(msg.sender.user_id)"
    />
    <!-- 内容 -->
    <div class="flex flex-col max-w-[75%] md:max-w-[65%] min-w-[60px]" :class="isMe ? 'items-end' : 'items-start'">
      <!-- 用户信息 -->
      <div
        class="ui-flex-x gap-2 mb-1 select-none leading-none"
        :class="isMe ? 'flex-row-reverse mr-1' : 'ml-1'"
      >
        <!-- 昵称 / 头衔 -->
        <template v-if="msg.message_type === 'group'">
          <span class="text-xs font-medium text-foreground-sub">{{ msg.sender.card || msg.sender.nickname }}</span>
          <!-- 头衔展示 -->
          <Chip
            v-if="groupMember.title || groupMember.role === 'owner' || groupMember.role === 'admin'"
            :label="groupMember.title || (groupMember.role === 'owner' ? '群主' : '管理')"
            class="text-[10px] h-4 !px-1 font-bold leading-tight shrink-0"
            :class="[
              groupMember.role === 'owner' ? 'bg-yellow-500/10 !text-yellow-600' :
              groupMember.role === 'admin' ? 'bg-green-500/10 !text-green-600' :
              'bg-background-dim/50 text-foreground-sub'
            ]"
          />
        </template>
        <!-- 撤回状态 -->
        <span v-if="isRecalled" class="text-[10px] text-foreground-dim flex items-center gap-1 bg-background-dim/50 px-1.5 py-0.5 rounded-sm">
          <div class="i-ri-arrow-go-back-line" /> 已撤回
        </span>
      </div>
      <!-- 气泡容器 -->
      <div
        class="relative flex flex-col overflow-hidden rounded-2xl shadow-sm bg-background-sub ui-trans"
        :class="[
          selectionMode ? 'cursor-default' : '',
          (forceMarkdown || showRaw) ? 'rounded-b-none' : ''
        ]"
      >
        <!-- 回复区域 -->
        <div
          v-if="replyDetail"
          class="px-3 py-2 text-xs flex flex-col gap-0.5 select-none cursor-pointer border-b border-background-dim/50 bg-background-dim/30 hover:bg-background-dim/50 ui-trans"
          @click.stop="scrollToMsg(replyDetail.id)"
        >
          <div class="ui-flex-x gap-1.5 font-bold text-foreground-main">
            <div class="i-ri-reply-fill text-primary" />
            <span>{{ replyDetail.sender }}</span>
          </div>
          <span class="truncate max-w-[180px] text-foreground-sub">{{ replyDetail.text }}</span>
        </div>
        <!-- 消息内容 -->
        <div class="text-[15px] text-foreground-main">
          <ElementRenderer
            :segments="msg.message"
            :group-id="msg.group_id"
            :on-insert-mention="onInsertMention"
          />
        </div>
        <!-- 多选遮罩 -->
        <div v-if="selectionMode" class="absolute inset-0 z-10 bg-transparent cursor-pointer" />
        <!-- 扩展面板容器 -->
        <div
          v-if="forceMarkdown || showRaw"
          class="w-full bg-background-dim/40 p-3 rounded-xl backdrop-blur-sm relative flex flex-col gap-3"
        >
          <!-- Markdown -->
          <div v-if="forceMarkdown" class="flex flex-col gap-2">
            <div class="text-[10px] text-primary font-bold uppercase tracking-widest ui-flex-x gap-1 opacity-80">
              <div class="i-ri-markdown-fill" /> Markdown
            </div>
            <component
              :is="getElement('markdown')"
              :segment="{ type: 'markdown', data: { content: textContent } }"
            />
          </div>
          <!-- Raw DATA -->
          <div v-if="showRaw" class="flex flex-col gap-2">
            <div class="text-[10px] text-primary font-bold uppercase tracking-widest ui-flex-x gap-1 opacity-80">
              <div class="i-ri-code-s-slash-line" /> Raw DATA
            </div>
            <div class="flex flex-col">
              <component
                :is="getElement('default')"
                v-for="(seg, i) in msg.message"
                :key="`raw-${i}`"
                :segment="seg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, Chip } from 'primevue'
import { useSettingStore, useMessageStore, useContactStore } from '@/stores'
import { getTextPreview } from '@/utils/format'
import ElementRenderer from '@/components/ElementRenderer.vue'
import { getElement } from '@/components/elements'
import { type Message } from '@/types'

const settingStore = useSettingStore()
const messageStore = useMessageStore()
const contactStore = useContactStore()

const props = defineProps<{
  msg: Message
  selectionMode?: boolean
  isSelected?: boolean
  forceMarkdown?: boolean
  showRaw?: boolean
  onContextMenu: (event: MouseEvent, msg: Message) => void
  onPoke: (targetId: number) => void
  onToggleSelect: (messageId: number) => void
  onInsertMention: (id: string, name: string) => void
}>()

// UI 状态
const isMe = computed(() => props.msg.sender.user_id === settingStore.user?.user_id) // 是否当前用户
const isSystem = computed(() => props.msg.sender.user_id === 10000) // 是否系统通知
const isRecalled = computed(() => !!(props.msg as any).recalled) // 是否已被撤回
const systemPreview = computed(() => isSystem.value ? getTextPreview(props.msg.message, props.msg.group_id) : '') // 系统消息预览

// 计算属性：群成员信息
const groupMember = computed(() => {
  if (props.msg.message_type === 'group' && props.msg.group_id) {
    const member = contactStore.members.get(props.msg.group_id)?.find(m => m.user_id === props.msg.sender.user_id)
    if (member) return member
  }
  return props.msg.sender
})

// 计算属性：合并文本内容
const textContent = computed(() => {
  return props.msg.message
    .filter(seg => seg.type === 'text')
    .map(seg => seg.data.text)
    .join('')
})

// 引用消息详情
const replyDetail = computed(() => {
  const replySeg = props.msg.message.find(s => s.type === 'reply')
  if (!replySeg?.data?.id) return null
  const idStr = String(replySeg.data.id)
  const found = messageStore.messages.find(m => String(m.message_id) === idStr)

  return {
    id: idStr,
    sender: found?.sender.card || found?.sender.nickname || '未知用户',
    text: found ? getTextPreview(found.message, found.group_id) : '未知内容'
  }
})

// 引用消息跳转
const scrollToMsg = (id: string | null) => {
  if (!id) return
  const el = document.getElementById(`msg-${id}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// 气泡点击事件
const onBubbleClick = () => {
  if (props.selectionMode) props.onToggleSelect(props.msg.message_id)
}
</script>
