<template>
  <div class="ui-flex-col-full bg-background-sub relative select-none">
    <!-- 顶部导航栏 -->
    <header class="h-14 shrink-0 px-3 border-b border-background-dim/50 flex items-center gap-3 z-30 bg-background-sub/95 backdrop-blur">
      <Button v-tooltip.bottom="'返回'" icon="i-ri-arrow-left-s-line" text rounded class="!w-8 !h-8 !text-foreground-sub shrink-0" @click="router.back()" />
      <div class="flex-1 min-w-0 flex items-center gap-2">
        <span class="font-bold text-base text-foreground-main truncate">群精华</span>
        <span class="text-[10px] px-1.5 rounded-md bg-background-dim/50 text-foreground-dim font-mono">{{ items.length }}</span>
      </div>
    </header>
    <!-- 列表区域 -->
    <div class="flex-1 min-h-0 bg-background-sub relative w-full overflow-hidden">
      <div v-if="items.length > 0" class="size-full overflow-y-auto ui-scrollbar">
        <div v-for="item in items" :key="item.message_id" class="w-full px-3 py-2">
          <div class="relative bg-background-main border border-background-dim/50 rounded-xl p-3 shadow-sm group hover:shadow-md ui-trans">
            <div class="flex items-center gap-3 mb-2">
              <!-- 头像 -->
              <Avatar
                :image="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.sender_id}`"
                shape="circle"
                class="!w-8 !h-8 bg-background-dim shrink-0 cursor-pointer border border-background-dim"
                @click.stop="router.push(`/${item.sender_id}`)"
              />
              <!-- 昵称 -->
              <div class="flex-1 min-w-0 font-bold text-sm text-foreground-main truncate">
                {{ item.sender_nick }}
              </div>
              <!-- 删除按钮 -->
              <Button
                v-if="canManage"
                v-tooltip.left="'删除'"
                icon="i-ri-delete-bin-line"
                text rounded severity="danger"
                class="!w-7 !h-7 !p-0 opacity-0 group-hover:opacity-100 ui-trans shrink-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                @click.stop="handleDelete(item)"
              />
              <!-- 操作信息 -->
              <div class="flex flex-col items-end shrink-0 text-[10px] text-foreground-dim font-mono leading-tight">
                <span>{{ formatTime(item.operator_time * 1000) }}</span>
                <div class="flex items-center gap-0.5 mt-0.5">
                  <div class="i-ri-star-fill text-yellow-500 text-[9px]" />
                  <span class="max-w-[80px] truncate">{{ item.operator_nick }}</span>
                </div>
              </div>
            </div>
            <!-- 消息内容 -->
            <div class="text-sm text-foreground-main/90 break-words whitespace-pre-wrap leading-relaxed select-text">
              <ElementRenderer
                :segments="item.content || []"
                :group-id="groupId"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- 空状态 -->
      <div v-else class="h-full ui-flex-center flex-col text-foreground-dim opacity-50 gap-2">
        <div class="i-ri-star-line text-4xl" />
        <span class="text-xs">暂无精华</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button, Avatar, useToast, useConfirm } from 'primevue'
import { bot } from '@/api'
import { formatTime } from '@/utils/format'
import ElementRenderer from '@/components/ElementRenderer.vue'
import { useContactStore, useSettingStore } from '@/stores'

// 全局 Hooks
const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const contactStore = useContactStore()
const settingStore = useSettingStore()

// 状态数据
const groupId = computed(() => Number(route.params.id))
const items = ref<any[]>([])

// 计算属性：当前用户信息
const myInfo = computed(() => contactStore.members.get(groupId.value)?.find(m => m.user_id === settingStore.user?.user_id))
// 计算属性：是否管理权限
const canManage = computed(() => ['owner', 'admin'].includes(myInfo.value?.role || ''))

// 删除精华消息
const handleDelete = (item: any) => {
  confirm.require({
    message: '确定要删除这条精华吗？', header: '删除精华', icon: 'i-ri-error-warning-line text-red-500', acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await bot.deleteEssenceMsg(item.message_id)
        const index = items.value.findIndex(i => i.message_id === item.message_id)
        if (index > -1) items.value.splice(index, 1)
      } catch (e) {
        toast.add({ severity: 'error', summary: '删除失败', detail: String(e), life: 3000 })
      }
    }
  })
}

// 组件挂载
onMounted(async () => {
  if (groupId.value) try {
    const res = await bot.getEssenceMsgList(groupId.value)
    items.value = (res || []).sort((a, b) => b.operator_time - a.operator_time)
  } catch (e) {
    toast.add({ severity: 'error', summary: '加载精华列表失败', detail: String(e), life: 3000 })
  }
})
</script>
