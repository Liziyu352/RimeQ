<template>
  <div class="relative flex flex-col shrink-0 z-20 ui-bg-background-sub border-t ui-border-background-dim ui-trans">
    <!-- 表情面板 -->
    <transition
      enter-active-class="ui-trans duration-200 ease-out"
      leave-active-class="ui-trans duration-150 ease-in"
      enter-from-class="opacity-0 translate-y-4 scale-95 origin-bottom-left"
      leave-to-class="opacity-0 translate-y-4 scale-95 origin-bottom-left"
    >
      <div v-if="activeTab" class="absolute bottom-full left-0 mb-2 ml-2 z-50">
        <div class="w-80 h-64 flex flex-col overflow-hidden rounded-2xl shadow-xl border backdrop-blur ui-bg-background-sub/95 ui-border-background-dim">
          <div class="flex-1 overflow-y-auto ui-scrollbar p-2">
            <!-- 普通表情列表 -->
            <div v-if="activeTab === 'emoji'" class="grid grid-cols-8 gap-1">
              <div
                v-for="code in emojiList"
                :key="code"
                class="aspect-square rounded ui-flex-center text-xl cursor-pointer ui-trans hover:ui-bg-background-dim"
                @click="insertText(String.fromCodePoint(code)); focus()"
              >
                {{ String.fromCodePoint(code) }}
              </div>
            </div>
            <!-- 超级表情列表 -->
            <div v-else-if="activeTab === 'super'" class="grid grid-cols-5 gap-2">
              <div
                v-for="id in superList"
                :key="id"
                class="relative aspect-square p-1.5 rounded-xl cursor-pointer ui-trans hover:ui-bg-background-dim"
                @mouseenter="loadLottie(id)"
                @mouseleave="unloadLottie(id)"
                @click="insertImage(EmojiUtils.getNormalUrl(id)); activeTab = null; focus()"
              >
                <img
                  v-show="hoveringId !== id"
                  :src="EmojiUtils.getNormalUrl(id)"
                  class="size-full object-contain pointer-events-none"
                  loading="lazy"
                />
                <div
                  v-show="hoveringId === id"
                  :ref="el => lottieRefs.set(id, el as HTMLElement)"
                  class="size-full pointer-events-none"
                />
              </div>
            </div>
            <!-- 收藏表情列表 -->
            <div v-else class="size-full ui-flex-y gap-2 text-foreground-dim opacity-60">
              <div class="i-ri-star-smile-line text-4xl" />
              <span class="text-xs">暂无收藏</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <!-- 工具栏 -->
    <div class="ui-flex-between px-3 pt-1.5 pb-1 gap-2 select-none">
      <!-- 左侧功能按钮 -->
      <div class="ui-flex-x gap-1">
        <!-- 表情面板 -->
        <Button
          v-for="btn in [
            { id: 'emoji', icon: 'i-ri-emotion-line text-lg' },
            { id: 'super', icon: 'i-ri-user-smile-line text-lg' },
            { id: 'collection', icon: 'i-ri-star-smile-line text-lg' }
          ]"
          :key="btn.id"
          :icon="btn.icon"
          rounded text
          class="!w-7 !h-7 !border-none ui-trans ui-ia-press"
          :class="activeTab === btn.id ? '!bg-primary !text-primary-content shadow-sm' : '!text-foreground-sub hover:!bg-background-dim hover:!text-foreground-main'"
          @click="activeTab = activeTab === btn.id ? null : btn.id"
        />
        <!-- 图片上传 -->
        <Button
          icon="i-ri-image-line text-lg"
          rounded text
          class="!w-7 !h-7 !border-none !text-foreground-sub hover:!bg-background-dim hover:!text-foreground-main ui-trans ui-ia-press"
          @click="imgInput?.click(); activeTab = null"
        />
        <!-- 文件上传 -->
        <Button
          icon="i-ri-file-line text-lg"
          rounded text
          class="!w-7 !h-7 !border-none !text-foreground-sub hover:!bg-background-dim hover:!text-foreground-main ui-trans ui-ia-press"
          @click="fileInput?.click(); activeTab = null"
        />
      </div>
      <!-- 右侧辅助按钮 -->
      <div class="ui-flex-x gap-2">
        <!-- 多选模式指示 -->
        <transition enter-active-class="ui-trans" leave-active-class="ui-trans" enter-from-class="opacity-0 scale-90" leave-to-class="opacity-0 scale-90">
          <div v-if="isMultiSelect" class="ui-flex-x gap-2 max-w-[200px]">
            <div class="h-7 px-3 rounded-full bg-primary text-primary-content text-xs font-bold ui-flex-center gap-2 shadow-sm whitespace-nowrap">
              <div class="i-ri-check-double-line" />
              <span>已选 {{ messageStore.selectedIds.length }}</span>
            </div>
            <Button
              icon="i-ri-close-line text-lg"
              text rounded
              class="!w-7 !h-7 shrink-0 !border-none !text-foreground-sub hover:!text-red-500 hover:!bg-background-dim"
              @click="messageStore.setMultiSelect()"
            />
          </div>
        </transition>
        <!-- 展开 / 收起按钮 -->
        <Button
          :icon="isExpanded ? 'i-ri-contract-up-down-line text-lg' : 'i-ri-expand-up-down-line text-lg'"
          text rounded
          class="!w-7 !h-7 shrink-0 ui-trans ui-ia-press"
          :class="isExpanded ? '!text-primary !bg-primary/10' : '!text-foreground-sub hover:!bg-background-dim hover:!text-foreground-main'"
          @click="isExpanded = !isExpanded"
        />
      </div>
    </div>
    <!-- 输入框容器 -->
    <div class="px-3 pb-3">
      <div
        class="relative w-full flex flex-col rounded-2xl border border-transparent overflow-hidden ui-trans bg-background-dim/30 focus-within:bg-background-dim/20 focus-within:border-primary/30 focus-within:shadow-[0_0_0_2px_var(--primary-soft)]"
        :class="isExpanded ? 'h-[50vh]' : 'h-auto min-h-[42px] max-h-[140px]'"
        @click="focus"
        @keydown.backspace="!editor?.getText() && messageStore.replyTarget && messageStore.setReplyTarget(null)"
      >
        <!-- 回复预览指示 -->
        <transition enter-active-class="ui-trans ui-dur-fast" leave-active-class="ui-trans ui-dur-fast" enter-from-class="opacity-0 -translate-y-2 h-0 m-0" leave-to-class="opacity-0 -translate-y-2 h-0 m-0">
          <div v-if="messageStore.replyTarget" class="mx-1.5 mt-2 px-3 py-1.5 rounded-lg border ui-border-background-dim ui-bg-background-sub/50 ui-flex-between shrink-0 select-none">
            <div class="ui-flex-x gap-2 overflow-hidden pr-2 text-xs">
              <div class="w-1 h-3 rounded-full bg-primary shrink-0" />
              <div class="ui-flex-truncate">
                <span class="ui-text-foreground-sub">回复 </span>
                <span class="font-bold ui-text-foreground-main">{{ messageStore.replyTarget.sender.nickname }}</span>
                <span class="opacity-60 ml-1 truncate">{{ getTextPreview(messageStore.replyTarget.message, messageStore.replyTarget.group_id) }}</span>
              </div>
            </div>
            <div class="i-ri-close-line text-sm cursor-pointer ui-text-foreground-dim hover:text-red-500 ui-trans" @click.stop="messageStore.setReplyTarget(null)" />
          </div>
        </transition>
        <!-- Tiptap 编辑器 -->
        <editor-content
          :editor="editor"
          class="chat-editor flex-1 w-full px-4 py-2 pr-12 text-sm leading-6 ui-text-foreground-main caret-primary ui-scrollbar overflow-y-auto flex flex-col justify-center"
        />
        <!-- 发送 / 转发按钮 -->
        <div class="absolute bottom-1 right-1 z-10">
          <Button
            :icon="isMultiSelect ? 'i-ri-share-forward-fill text-lg' : 'i-ri-send-plane-fill text-lg'"
            rounded
            class="!w-8 !h-8 !border-none shadow-sm ui-trans active:scale-95"
            :class="(!isMultiSelect && isEmpty) ? '!bg-background-dim !text-foreground-dim cursor-not-allowed' : '!bg-primary !text-primary-content hover:!bg-primary-hover shadow-primary/20'"
            :disabled="isMultiSelect ? !messageStore.selectedIds.length : isEmpty"
            @click.stop="handleSend"
          />
        </div>
      </div>
    </div>
    <!-- 原生文件输入(隐藏) -->
    <input ref="imgInput" type="file" accept="image/*" class="hidden" @change="e => handleUpload('img', e)">
    <input ref="fileInput" type="file" class="hidden" @change="e => handleUpload('file', e)">
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Button, useToast } from 'primevue'
import { EditorContent } from '@tiptap/vue-3'
import type { AnimationItem } from 'lottie-web'
import { bot } from '@/api'
import { useMessageStore } from '@/stores'
import { useChatEditor } from '@/utils/editor'
import { EmojiUtils, emojiList, superList } from '@/utils/emoji'
import { getTextPreview } from '@/utils/format'

defineOptions({ name: 'ChatInput' })

const props = defineProps<{ chatId: string; isGroup: boolean }>()
const emit = defineEmits<{ (e: 'send'): void }>()

// 全局 Hooks
const router = useRouter()
const toast = useToast()
const messageStore = useMessageStore()

// UI 界面状态
const activeTab = ref<string | null>(null)
const isExpanded = ref(false)
const hoveringId = ref<number | null>(null)
const imgInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()

// Lottie 资源管理
const lottieMap = new Map<number, AnimationItem>()
const lottieRefs = new Map<number, HTMLElement>()
const lottieCache = new Map<number, any>()

// 计算属性
const isMultiSelect = computed(() => messageStore.isMultiSelect)
const isEmpty = computed(() => !editor.value || editor.value.isEmpty)

// 编辑器初始化
const { editor, focus, insertText, insertImage, insertMention, clear, getSegments } = useChatEditor({
  currentId: computed(() => props.chatId),
  isGroup: computed(() => props.isGroup),
  onSend: handleSend,
  onFile: (f) => {
    const dt = new DataTransfer()
    dt.items.add(f)
    const e = { target: { files: dt.files, value: '' } } as unknown as Event
    handleUpload('file', e)
  }
})

// 暴露方法
defineExpose({ insertText, insertMention, focus })

// 文件上传
async function handleUpload(type: 'img' | 'file', e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  if (type === 'img') {
    const reader = new FileReader()
    reader.onload = (ev) => {
      insertImage(ev.target?.result as string)
      focus()
    }
    reader.readAsDataURL(file)
  } else {
    toast.add({ severity: 'info', summary: '正在上传', detail: file.name, life: 3000 })
    try {
      const buffer = await file.arrayBuffer()
      const b64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''))
      await bot.uploadFile(props.isGroup ? 'group' : 'private', Number(props.chatId), 'base64://' + b64, file.name);
      emit('send')
      toast.add({ severity: 'success', summary: '上传成功', life: 3000 })
    } catch (err) {
      toast.add({ severity: 'error', summary: '上传失败', detail: String(err), life: 3000 })
    }
  }
}

// Lottie 动画加载
async function loadLottie(id: number) {
  hoveringId.value = id
  if (lottieMap.has(id)) return
  try {
    if (!lottieCache.has(id)) {
      const res = await fetch(EmojiUtils.getSuperUrl(id))
      const json = await res.json()
      lottieCache.set(id, json)
    }
    const container = lottieRefs.get(id)
    if (container) {
      const lottie = (await import('lottie-web')).default
      const anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: lottieCache.get(id)
      })
      lottieMap.set(id, anim)
    }
  } catch { /* 忽略加载错误 */ }
}

// Lottie 动画卸载
function unloadLottie(id: number) {
  hoveringId.value = null
  const anim = lottieMap.get(id)
  if (anim) {
    anim.destroy()
    lottieMap.delete(id)
  }
}

// 发送消息
async function handleSend() {
  // 处理多选逻辑
  if (isMultiSelect.value) {
    if (messageStore.selectedIds.length > 0) router.push(`/${props.chatId}/forward`)
    return
  }
  if (isEmpty.value) return
  const segments = getSegments()
  // 添加回复节点
  if (messageStore.replyTarget) {
    segments.unshift({
      type: 'reply',
      data: { id: String(messageStore.replyTarget.message_id) }
    })
  }
  if (!segments.length) return
  // 重置界面状态
  clear()
  messageStore.setReplyTarget(null)
  isExpanded.value = false
  try {
  const messageType = props.isGroup ? 'group' : 'private';
  const targetId = Number(props.chatId);
  await bot.sendMsg(messageType, targetId, segments);
    emit('send')
  } catch (e) {
    toast.add({ severity: 'error', summary: '发送失败', detail: String(e) })
  }
  nextTick(focus)
}

// 引用变化自动聚焦
watch(() => messageStore.replyTarget, (target) => {
  if (target) focus()
})

// 多选模式重置状态
watch(isMultiSelect, (val) => {
  if (val) {
    activeTab.value = null
    isExpanded.value = false
  }
})

// 会话切换重置状态
watch(() => props.chatId, () => {
  isExpanded.value = false
  activeTab.value = null
  messageStore.setReplyTarget(null)
})

// 清理资源
onBeforeUnmount(() => {
  lottieMap.forEach(anim => anim.destroy())
  lottieMap.clear()
  lottieRefs.clear()
  editor.value?.destroy()
})
</script>

<style lang="scss">
/* Tiptap 编辑器 */
.chat-editor {
  .ProseMirror {
    outline: none;
    min-height: 24px;
    p { margin: 0; }
    /* 插入图片样式 */
    img {
      display: inline-block;
      max-width: 100%;
      max-height: 80px;
      object-fit: contain;
      border-radius: 8px;
      margin: 2px 0;
      vertical-align: bottom;
      /* 图片选中样式 */
      &.ProseMirror-selectednode {
        outline: 2px solid var(--primary-color);
      }
    }
    /* 提及 (@) 样式 */
    .mention {
      color: var(--primary-color);
      background-color: var(--primary-soft);
      border-radius: 4px;
      padding: 1px 4px;
      font-weight: 500;
    }
    /* 占位符样式 */
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: var(--text-dim);
      pointer-events: none;
      height: 0;
    }
  }
}
</style>
