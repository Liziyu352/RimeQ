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
            <div v-if="activeTab === 'face'" class="flex flex-col gap-1">
              <!-- 普通表情 -->
              <div class="grid grid-cols-8 gap-1">
                <div
                  v-for="item in QFace.getList('face')"
                  :key="item.id"
                  class="aspect-square p-1 rounded cursor-pointer ui-trans hover:ui-bg-background-dim"
                  :title="item.name"
                  @click="insertImage(item.assets.static); focus()"
                >
                  <img :src="item.assets.static" class="size-full object-contain pointer-events-none" loading="lazy" />
                </div>
              </div>
              <!-- 分隔线 -->
              <div class="flex items-center gap-1 px-1 py-1 opacity-60">
                <div class="h-px bg-background-dim flex-1" />
                <span class="text-[10px] text-foreground-dim font-bold uppercase tracking-wider">QFace / Emoji</span>
                <div class="h-px bg-background-dim flex-1" />
              </div>
              <!-- Emoji -->
              <div class="grid grid-cols-8 gap-1">
                <div
                  v-for="item in QFace.getList('emoji')"
                  :key="item.id"
                  class="aspect-square rounded ui-flex-center text-xl cursor-pointer ui-trans hover:ui-bg-background-dim"
                  :title="item.name"
                  @click="insertText(item.id); focus()"
                >
                  {{ item.id }}
                </div>
              </div>
            </div>
            <!-- 超级表情列表 -->
            <div v-else-if="activeTab === 'super'" class="flex flex-col gap-1">
              <template
                v-for="group in [{ id: 0, name: '特殊' }, { id: 1, name: '黄脸' }, { id: 2, name: '旺旺' },
                  { id: 3, name: '喜花妮' }, { id: 4, name: '黄脸' }, { id: 5, name: '企鹅' }, { id: 6, name: '噗噗星人' }]"
                :key="group.id"
              >
                <div v-if="QFace.getList('super').some(i => i.packId === group.id)" class="flex flex-col gap-1">
                  <!-- 分隔线 -->
                  <div class="flex items-center gap-1 px-1 py-1 opacity-60">
                    <div class="h-px bg-background-dim flex-1" />
                    <span class="text-[10px] text-foreground-dim font-bold uppercase tracking-wider">{{ group.name }}</span>
                    <div class="h-px bg-background-dim flex-1" />
                  </div>
                  <!-- 列表 -->
                  <div class="grid grid-cols-5 gap-1">
                    <div
                      v-for="item in QFace.getList('super').filter(i => i.packId === group.id)"
                      :key="item.id"
                      class="relative aspect-square p-1.5 rounded-xl cursor-pointer ui-trans hover:ui-bg-background-dim"
                      :title="item.name"
                      @mouseenter="loadLottie(item.id, item.assets.lottie)"
                      @mouseleave="unloadLottie(item.id)"
                      @click="handleFace(item)"
                    >
                      <img
                        v-show="hoveringId !== item.id"
                        :src="item.assets.static"
                        class="size-full object-contain pointer-events-none"
                        loading="lazy"
                      />
                      <div
                        v-show="hoveringId === item.id"
                        :ref="el => lottieRefs.set(item.id, el as HTMLElement)"
                        class="size-full pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </template>
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
            { id: 'face', icon: 'i-ri-emotion-line text-lg', tip: ' 普通表情' },
            { id: 'super', icon: 'i-ri-user-smile-line text-lg', tip: '超级表情' },
            { id: 'collection', icon: 'i-ri-star-smile-line text-lg', tip: '收藏表情' }
          ]"
          :key="btn.id"
          v-tooltip.top="btn.tip"
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
    <!-- 文件输入（隐藏） -->
    <input ref="imgInput" type="file" accept="image/*" class="hidden" @change="e => handleUpload('img', e)">
    <input ref="fileInput" type="file" class="hidden" @change="e => handleUpload('file', e)">
    <!-- 表情结果选择弹窗 -->
    <Dialog
      v-model:visible="gameDialog.visible"
      modal dismissable-mask
      :header="'选择结果'"
      :style="{ width: 'auto' }"
    >
      <div class="flex gap-2 justify-center">
        <!-- 骰子 -->
        <template v-if="gameDialog.type === 'dice'">
          <Button
            v-for="i in 6" :key="i"
            :label="String(i)"
            severity="secondary" outlined
            class="!w-9 !h-9 !p-0 !rounded-xl !border-surface-200 dark:!border-surface-700 hover:!border-primary hover:!bg-primary/5 transition-all font-bold"
            @click="postSegment([{ type: 'dice', data: { result: String(i) } }])"
          />
        </template>
        <!-- 猜拳 -->
        <template v-else>
           <Button
            v-for="opt in [{v:1, l:'布', i:'🖐'}, {v:2, l:'剪刀', i:'✌'}, {v:3, l:'石头', i:'✊'}]"
            :key="opt.v"
            severity="secondary" outlined
            class="!px-2.5 !py-1.5 !h-auto flex-col gap-0.5 !rounded-xl !border-surface-200 dark:!border-surface-700 hover:!border-primary hover:!bg-primary/5 transition-all min-w-[3.5rem]"
            @click="postSegment([{ type: 'rps', data: { result: String(opt.v) } }])"
          >
            <div class="text-lg leading-none filter drop-shadow-sm">{{ opt.i }}</div>
            <span class="text-[10px] font-bold opacity-80">{{ opt.l }}</span>
          </Button>
        </template>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Button, useToast, Dialog } from 'primevue'
import { EditorContent } from '@tiptap/vue-3'
import type { AnimationItem } from 'lottie-web'
import { bot } from '@/api'
import { useMessageStore, useSettingStore } from '@/stores'
import { useChatEditor } from '@/utils/editor'
import { QFace } from '@/utils/qface'
import { getTextPreview } from '@/utils/format'

defineOptions({ name: 'ChatInput' })

const props = defineProps<{ chatId: string; isGroup: boolean }>()
const emit = defineEmits<{ (e: 'send'): void }>()

// 全局 Hooks
const router = useRouter()
const toast = useToast()
const messageStore = useMessageStore()
const settingStore = useSettingStore()

// UI 界面状态
const activeTab = ref<string | null>(null)
const isExpanded = ref(false)
const hoveringId = ref<string | null>(null)
const imgInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()

// 表情逻辑状态
const gameDialog = reactive({ visible: false, type: 'dice' as 'dice' | 'rps' })

// Lottie 资源管理
const lottieMap = new Map<string, AnimationItem>()
const lottieRefs = new Map<string, HTMLElement>()
const lottieCache = new Map<string, any>()
const loadingSet = new Set<string>()

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

// 发送消息
async function postSegment(segments: any[]) {
  gameDialog.visible = false
  try {
    await bot.sendMsg(props.isGroup ? 'group' : 'private', Number(props.chatId), segments)
    emit('send')
  } catch (e) {
    toast.add({ severity: 'error', summary: '发送失败', detail: String(e), life: 3000 })
  }
}

// 处理表情点击
function handleFace(item: any) {
  activeTab.value = null
  if ((item.id === '358' || item.id === '359') && settingStore.config.enableCustomFace) {
    gameDialog.type = item.id === '358' ? 'dice' : 'rps'
    gameDialog.visible = true
    return
  }
  const type = item.id === '358' ? 'dice' : item.id === '359' ? 'rps' : 'face'
  const data = (item.id === '358' || item.id === '359')
    ? { result: String(Math.floor(Math.random() * (item.id === '358' ? 6 : 3)) + 1) } : { id: item.id }
  postSegment([{ type, data }])
}

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
async function loadLottie(id: string, url?: string) {
  if (!url) return
  hoveringId.value = id
  if (lottieMap.has(id) || loadingSet.has(id)) return
  loadingSet.add(id)
  try {
    const [lottie, animationData] = await Promise.all([
      import('lottie-web').then(m => m.default),
      lottieCache.get(id) || fetch(url).then(r => r.json()).then(data => lottieCache.set(id, data).get(id))
    ])
    if (hoveringId.value !== id) return
    const container = lottieRefs.get(id)
    if (container) {
      container.innerHTML = ''
      const anim = lottie.loadAnimation({ container, renderer: 'svg', loop: true, autoplay: true, animationData })
      lottieMap.set(id, anim)
    }
  } catch { /* 忽略错误 */ }
  finally {
    loadingSet.delete(id)
  }
}

// Lottie 动画卸载
function unloadLottie(id: string) {
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
  // 发送消息
  await postSegment(segments)
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
