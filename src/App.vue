================ START FILE: C:\Users\YisRime\RimeQ\src\App.vue ================
<template>
  <!-- 根容器 -->
  <div
    class="ui-flex-col-full overflow-hidden select-none text-foreground-main font-sans ui-trans p-2 gap-2 bg-background-main"
    :style="rootStyle"
  >
    <!-- 背景遮罩 -->
    <div
      v-if="settingStore.config.backgroundImg"
      class="ui-abs-full bg-background-main/40 backdrop-blur-sm -z-10"
      :style="`backdrop-filter: blur(${settingStore.config.backgroundBlur}px);`"
    />
    <!-- 布局容器 -->
    <div class="flex flex-1 overflow-hidden relative gap-0 md:gap-3">
      <!-- 左侧导航栏 -->
      <aside
        class="flex flex-col shrink-0 bg-background-sub/40 backdrop-blur-2xl backdrop-saturate-150 shadow-lg border border-white/10 ui-trans z-30 overflow-hidden relative rounded-2xl w-full md:w-[72px] xl:w-80"
        :class="[isMobile && isContentMode ? '!w-0 !opacity-0 !border-none' : '']"
      >
        <!-- 侧边栏 -->
        <header class="h-16 shrink-0 relative ui-flex-x border-b border-border/20 transition-colors w-full md:w-[72px] xl:w-full">
          <div class="w-[72px] h-full shrink-0 ui-flex-center">
            <div class="relative group cursor-pointer" @click="showMenu = !showMenu">
              <Avatar
                :image="userAvatar"
                shape="circle"
                class="shrink-0 ring-2 ring-white/20 group-hover:ring-primary/50 ui-trans w-10 h-10 bg-background-sub/50"
              />
              <Badge
                class="absolute bottom-0 right-0 !w-3.5 !h-3.5 !min-w-0 border-2 border-background-sub ui-trans"
                :severity="settingStore.isLogged ? 'success' : 'secondary'"
              />
            </div>
          </div>
          <!-- 菜单与搜索 -->
          <div class="ui-flex-truncate ui-flex-x gap-2 pr-3 flex md:hidden xl:flex">
            <div
              class="ui-flex-x justify-start gap-1 shrink-0 ui-trans overflow-hidden"
              :class="showMenu ? 'w-[108px] opacity-100' : 'w-0 opacity-0'"
            >
              <Button
                v-for="btn in navButtons"
                :key="btn.path"
                v-tooltip.bottom="btn.label"
                :icon="btn.icon"
                text rounded severity="secondary"
                class="!w-8 !h-8 !p-0 ui-trans"
                :class="route.path === btn.path ? '!bg-primary !text-primary-content shadow-sm' : 'text-foreground-sub hover:!bg-primary/10 hover:!text-primary'"
                @click="router.push(btn.path)"
              />
            </div>
            <IconField class="w-full">
              <InputIcon class="i-ri-search-line text-foreground-sub" />
              <InputText
                v-model="searchKeyword"
                placeholder="搜索"
                class="w-full !h-9 text-sm !bg-background-dim/50 !border-transparent focus:!bg-background-sub/80 !rounded-lg !pl-9 ui-trans placeholder:text-foreground-dim text-foreground-main"
              />
            </IconField>
          </div>
        </header>
        <!-- 垂直菜单 (平板模式) -->
        <div
          class="flex-col items-center gap-2 bg-transparent z-20 w-full ui-trans overflow-hidden hidden md:flex xl:hidden"
          :class="showMenu ? 'max-h-[200px] opacity-100 py-3' : 'max-h-0 opacity-0 py-0'"
        >
          <Button
            v-for="btn in navButtons"
            :key="btn.path"
            v-tooltip.right="btn.label"
            :icon="btn.icon"
            text rounded severity="secondary"
            class="!w-10 !h-10 !p-0 ui-trans"
            :class="route.path === btn.path ? '!bg-primary !text-primary-content shadow-md' : 'text-foreground-sub hover:!bg-primary/10 hover:!text-primary'"
            @click="router.push(btn.path)"
          />
        </div>
        <!-- 导航列表 -->
        <div class="flex-1 overflow-hidden relative w-full ui-trans">
          <div class="size-full relative min-w-[320px] md:min-w-[72px] xl:min-w-[320px]">
            <router-view name="nav" />
          </div>
        </div>
      </aside>
      <!-- 主内容区 -->
      <main
        class="ui-flex-truncate flex flex-col overflow-hidden bg-background-sub/40 backdrop-blur-2xl backdrop-saturate-150 shadow-lg border border-white/10 relative z-20 ui-trans rounded-2xl"
        :class="[isMobile && !isContentMode ? '!w-0 !min-w-0 !flex-none !opacity-0 !border-none' : '']"
      >
        <!-- 标题栏 -->
        <header
          v-if="pageTitle"
          class="h-16 shrink-0 border-b border-border/10 bg-transparent ui-flex-between px-4 z-20 select-none ui-trans"
        >
          <div class="ui-flex-x gap-3 h-full overflow-hidden">
            <div
              v-if="showBackButton"
              class="w-8 h-8 rounded-full ui-flex-center ui-ia hover:bg-background-sub/50 text-foreground-main bg-background-sub/20 shrink-0"
              @click="handleBack"
            >
              <div class="i-ri-arrow-left-s-line text-lg" />
            </div>
            <span class="font-bold text-lg text-foreground-main truncate">{{ pageTitle }}</span>
          </div>
          <!-- 群组快捷入口 -->
          <div v-if="isGroup" class="ui-flex-x gap-1 text-foreground-sub">
             <Button v-for="act in groupActions" :key="act.path" :icon="act.icon" v-tooltip.bottom="act.label" text rounded class="!w-9 !h-9 !text-foreground-sub hover:!text-primary hover:!bg-background-sub/50" @click="router.push(`/${chatId}/${act.path}`)" />
          </div>
        </header>
        <!-- 路由视图 -->
        <div class="ui-flex-col-full relative overflow-hidden ui-flex-truncate">
          <router-view v-slot="{ Component }">
            <keep-alive :include="['ChatView', 'SettingsView', 'ContactView']">
              <component :is="Component" :key="route.path" class="size-full" />
            </keep-alive>
          </router-view>
        </div>
      </main>
      <!-- 右侧侧边栏 -->
      <router-view v-slot="{ Component }" name="sidebar">
        <Transition
          enter-active-class="ui-trans duration-300 ease-[cubic-bezier(0.25,0.8,0.5,1)]"
          leave-active-class="ui-trans duration-300 ease-[cubic-bezier(0.25,0.8,0.5,1)]"
          enter-from-class="translate-x-full md:translate-x-0 md:w-0 md:opacity-0"
          leave-to-class="translate-x-full md:translate-x-0 md:w-0 md:opacity-0"
        >
          <aside
            v-if="Component"
            class="bg-background-sub/40 backdrop-blur-2xl backdrop-saturate-150 z-[60] overflow-hidden flex flex-col border border-white/10 shadow-xl ui-trans rounded-2xl absolute inset-y-0 right-0 w-full md:static md:w-[320px] md:shadow-lg md:z-0"
          >
            <component :is="Component" class="size-full" />
          </aside>
        </Transition>
      </router-view>
    </div>
    <!-- 全局组件 -->
    <Toast position="top-left" />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Avatar, IconField, InputIcon, InputText, Button } from 'primevue'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { useSettingStore, useSessionStore, useContactStore } from '@/stores'
import { SearchKey } from '@/types'

const router = useRouter()
const route = useRoute()
const settingStore = useSettingStore()
const sessionStore = useSessionStore()
const contactStore = useContactStore()

// 响应式断点
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')

// 界面状态
const searchKeyword = ref('')
const showMenu = ref(false)

// 注入上下文
provide(SearchKey, searchKeyword)

// 样式计算：根背景
const rootStyle = computed(() => {
  const bg = settingStore.config.backgroundImg
  return bg ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}
})

// 数据计算：当前用户信息
const userAvatar = computed(() => {
  const uid = settingStore.user?.user_id
  return uid ? `https://q1.qlogo.cn/g?b=qq&s=0&nk=${uid}` : ''
})

// 数据计算：当前上下文
const chatId = computed(() => Number(route.params.id) || 0)
const session = computed(() => sessionStore.getSession(chatId.value))
const isGroup = computed(() => !!chatId.value && sessionStore.getSessionType(chatId.value) === 'group')
const isContentMode = computed(() => route.path !== '/' && route.path !== '/contact')
const showBackButton = computed(() => isMobile.value)

// 数据计算：页面标题
const pageTitle = computed(() => {
  if (route.name === 'Login') return ''
  if (chatId.value) {
    let name: string
    if (isGroup.value) {
      name = contactStore.getGroupName(chatId.value)
    } else {
      name = contactStore.getUserName(chatId.value)
    }
    return name !== String(chatId.value) ? name : session.value?.name || chatId.value
  }
  return route.meta.title
})

// 静态配置：导航菜单
const navButtons = [
  { label: '会话', path: '/', icon: 'i-ri-message-3-line text-xl' },
  { label: '好友', path: '/contact', icon: 'i-ri-contacts-book-line text-xl' },
  { label: '设置', path: '/settings', icon: 'i-ri-settings-3-line text-xl' }
]

const groupActions = [
  { label: '群精华', path: 'essence', icon: 'i-ri-star-line' },
  { label: '群公告', path: 'notice', icon: 'i-ri-megaphone-line' },
  { label: '群相册', path: 'album', icon: 'i-ri-gallery-line' },
  { label: '群文件', path: 'file', icon: 'i-ri-folder-open-line' },
  { label: '群信息', path: 'info', icon: 'i-ri-profile-line' },
]

// 交互方法：返回处理
const handleBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style lang="scss">
/* 全局基础重置 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  color: var(--text-main);
  overscroll-behavior: none;
  -webkit-font-smoothing: antialiased;
}

/* 防止拖拽图片 */
img {
  -webkit-user-drag: none;
  user-select: none;
}
</style>
