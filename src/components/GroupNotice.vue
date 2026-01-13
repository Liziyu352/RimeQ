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
      <span class="font-bold text-base text-foreground-main">群公告</span>
    </header>

    <!-- 列表区域 -->
    <div class="flex-1 overflow-y-auto ui-scrollbar p-3">
      <div v-if="loading" class="flex-center py-20 text-foreground-sub gap-2">
        <div class="i-ri-loader-4-line animate-spin text-xl" />
        <span class="text-sm">加载中...</span>
      </div>

      <div v-else-if="notices.length === 0" class="flex-col flex-center py-20 text-foreground-dim opacity-60">
        <div class="i-ri-notification-off-line text-4xl mb-2" />
        <span class="text-sm">暂无公告</span>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="(notice, index) in notices"
          :key="index"
          class="relative bg-background-main border border-background-dim rounded-2xl p-4 overflow-hidden shadow-sm ui-trans hover:shadow-md"
        >
          <!-- 装饰图标 -->
          <div class="absolute -right-2 -top-2 text-6xl text-primary/5 rotate-12 pointer-events-none">
            <div class="i-ri-pushpin-fill" />
          </div>

          <!-- 发布者信息 -->
          <div class="flex items-center gap-2 mb-3 relative z-10">
            <Avatar
              :image="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${notice.sender_id}`"
              shape="circle"
              class="!w-8 !h-8 bg-background-dim border border-background-dim"
            />
            <div class="flex flex-col">
              <span class="text-sm font-bold text-foreground-main">{{ contactStore.getUserName(notice.sender_id) }}</span>
              <span class="text-[10px] text-foreground-dim">{{ formatTime(notice.publish_time * 1000) }}</span>
            </div>
          </div>

          <!-- 内容 -->
          <div class="text-sm text-foreground-sub whitespace-pre-wrap leading-relaxed relative z-10">
            <div v-if="notice.msg.image" class="mb-2">
               <img :src="notice.msg.image.id" class="max-w-full rounded-lg max-h-40 object-cover bg-background-dim/50" loading="lazy"/>
            </div>
            {{ notice.msg.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button, Avatar } from 'primevue'
import { bot } from '@/api'
import { useContactStore } from '@/stores'
import { formatTime } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const contactStore = useContactStore()

const groupId = computed(() => Number(route.params.id))
const loading = ref(false)
const notices = ref<any[]>([])

onMounted(async () => {
  if (!groupId.value) return
  loading.value = true
  try {
    const res = await bot.getGroupNotice(groupId.value)
    // 适配不同的后端返回结构，这里假设通用结构，实际根据后端可能需要调整
    notices.value = res.map((n: any) => ({
      sender_id: n.sender_id || n.u,
      publish_time: n.publish_time || n.t,
      msg: n.msg || { text: n.c } // 兼容性处理
    })).sort((a: any, b: any) => b.publish_time - a.publish_time)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
