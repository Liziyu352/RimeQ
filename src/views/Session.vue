<template>
  <!-- 会话列表容器 -->
  <div class="ui-flex-col-full bg-transparent">
    <!-- 滚动区域 -->
    <div class="flex-1 overflow-y-auto ui-scrollbar px-2 py-2">
      <VirtualScroller :items="filteredSessions" :item-size="64" class="size-full ui-scrollbar" >
        <template #item="{ item: session }">
          <div class="py-0.5">
            <!-- 会话项 -->
            <div
              :key="session.id"
              class="group relative rounded-xl cursor-pointer select-none overflow-hidden ui-trans ui-dur-normal p-2.5 md:p-2 xl:p-2.5"
              :class="[
                isActive(session.id)
                  ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                  : 'hover:bg-background-dim/50 bg-transparent text-foreground-main'
              ]"
              @click="handleSessionClick(session.id)"
            >
              <!-- 内容布局 -->
              <div class="grid grid-cols-[auto_1fr] items-center ui-trans ui-dur-normal">
                <!-- 头像区域 -->
                <div class="relative ui-flex-center">
                  <Avatar
                    shape="circle"
                    :image="session.avatar"
                    class="shrink-0 select-none ui-trans ui-dur-normal !w-10 !h-10"
                    :class="[
                      isActive(session.id)
                        ? 'ring-0 bg-transparent'
                        : 'border border-background-dim/30 bg-background-sub'
                    ]"
                  />
                  <!-- 未读角标 -->
                  <Badge
                    v-if="session.unread > 0"
                    :value="session.unread"
                    severity="danger"
                    class="absolute -top-1 -right-1 !text-[10px] !h-4 !max-w-9 ui-trans ui-dur-normal"
                    :class="isActive(session.id) ? 'border-primary' : 'border-background-sub'"
                  />
                </div>
                <!-- 文本信息 (平板模式隐藏) -->
                <div
                  class="grid ui-trans ui-dur-normal ease-in-out grid-cols-[1fr] opacity-100 ml-3 md:grid-cols-[0fr] md:opacity-0 md:ml-0 xl:grid-cols-[1fr] xl:opacity-100 xl:ml-3"
                >
                  <div class="overflow-hidden min-w-0 flex flex-col justify-center h-10">
                    <!-- 顶部：名称 + 时间 -->
                    <div class="ui-flex-between mb-0.5">
                      <span
                        class="text-[14px] font-medium truncate ui-trans ui-dur-normal"
                        :class="isActive(session.id) ? 'font-bold' : ''"
                      >
                        {{ getSessionName(session) }}
                      </span>
                      <span
                        class="text-xs shrink-0 ml-2 font-mono ui-trans ui-dur-normal"
                        :class="isActive(session.id) ? 'text-primary-content/80' : 'text-foreground-dim'"
                      >
                        {{ formatTime(session.time) }}
                      </span>
                    </div>
                    <!-- 底部：预览内容 -->
                    <div class="ui-flex-x">
                      <span
                        class="truncate text-[12px] ui-trans ui-dur-normal"
                        :class="isActive(session.id) ? 'text-primary-content/70' : 'text-foreground-sub opacity-80'"
                      >
                        {{ session.preview }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </VirtualScroller>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Avatar, Badge, VirtualScroller } from 'primevue'
import { useSessionStore, useContactStore, type Session } from '@/stores'
import { formatTime } from '@/utils/format'
import { SearchKey } from '@/types'

defineOptions({ name: 'SessionView' })

// 路由与状态管理
const router = useRouter()
const route = useRoute()
const keyword = inject(SearchKey, ref(''))
const sessionStore = useSessionStore()
const contactStore = useContactStore()

// 判断当前会话是否激活
const isActive = (id: number) => Number(route.params.id) === id

// 点击会话跳转
const handleSessionClick = (id: number) => {
  router.push(`/${id}`)
}

// 过滤会话列表 (支持搜索)
const filteredSessions = computed(() => {
  let list = sessionStore.sessions
  if (keyword.value) {
    const k = keyword.value.toLowerCase().trim()
    list = list.filter((s) => getSessionName(s).toLowerCase().includes(k))
  }
  return list
})

// 获取会话显示名称
const getSessionName = (session: Session) => {
  let name: string
  if (session.type === 'group' || contactStore.checkIsGroup(session.id)) {
    name = contactStore.getGroupName(session.id)
  } else {
    name = contactStore.getUserName(session.id)
  }
  return name === String(session.id) ? session.name : name
}
</script>
