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
      <span class="font-bold text-base text-foreground-main">群文件</span>
    </header>

    <!-- 面包屑导航 -->
    <div class="px-4 py-3 shrink-0 flex items-center gap-1 text-sm overflow-x-auto ui-scrollbar border-b border-background-dim/30">
      <div
        class="flex items-center gap-1 cursor-pointer hover:text-primary ui-trans whitespace-nowrap"
        :class="pathStack.length === 0 ? 'text-foreground-main font-bold' : 'text-foreground-sub'"
        @click="navigateTo(-1)"
      >
        <div class="i-ri-hard-drive-2-line" />
        <span>根目录</span>
      </div>
      <template v-for="(folder, index) in pathStack" :key="folder.id">
        <div class="i-ri-arrow-right-s-line text-foreground-dim" />
        <div
          class="cursor-pointer hover:text-primary ui-trans whitespace-nowrap max-w-[100px] truncate"
          :class="index === pathStack.length - 1 ? 'text-foreground-main font-bold' : 'text-foreground-sub'"
          @click="navigateTo(index)"
        >
          {{ folder.name }}
        </div>
      </template>
    </div>

    <!-- 列表区域 -->
    <div class="flex-1 overflow-y-auto ui-scrollbar p-2">
      <div v-if="loading" class="flex-center py-20 text-foreground-sub gap-2">
        <div class="i-ri-loader-4-line animate-spin text-xl" />
        <span class="text-sm">加载中...</span>
      </div>

      <div v-else-if="items.length === 0" class="flex-col flex-center py-20 text-foreground-dim opacity-60">
        <div class="i-ri-folder-open-line text-4xl mb-2" />
        <span class="text-sm">暂无文件</span>
      </div>

      <div v-else class="flex flex-col gap-1">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer ui-trans hover:bg-background-dim/50 group"
          @click="handleItemClick(item)"
        >
          <!-- 图标 -->
          <div
            class="w-10 h-10 rounded-lg flex-center shrink-0 text-xl"
            :class="item.type === 'folder' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'"
          >
            <div :class="item.type === 'folder' ? 'i-ri-folder-3-fill' : 'i-ri-file-text-line'" />
          </div>

          <!-- 信息 -->
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <div class="text-sm font-medium text-foreground-main truncate">{{ item.name }}</div>
            <div class="text-xs text-foreground-sub flex gap-3 mt-0.5">
              <span v-if="item.size">{{ item.size }}</span>
              <span v-if="item.uploader">by {{ item.uploader }}</span>
              <span v-if="item.count" class="text-foreground-dim">{{ item.count }} 项</span>
            </div>
          </div>

          <!-- 操作 -->
          <div class="shrink-0 text-foreground-sub ui-trans">
             <div v-if="item.type === 'folder'" class="i-ri-arrow-right-s-line text-lg" />
             <div v-else class="i-ri-download-2-line text-lg hover:text-primary opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button, useToast } from 'primevue'
import { bot } from '@/api'
import { formatFileSize } from '@/utils/format'

interface FileItem {
  id: string
  name: string
  type: 'folder' | 'file'
  size?: string
  uploader?: string
  count?: number // 文件夹内文件数
  busid?: number // 文件需要的参数
}

const router = useRouter()
const route = useRoute()
const toast = useToast()

const groupId = computed(() => Number(route.params.id))
const loading = ref(false)
const items = ref<FileItem[]>([])
const pathStack = ref<{ id: string; name: string }[]>([])

const loadFiles = async (folderId = '/') => {
  if (!groupId.value) return
  loading.value = true
  items.value = []
  try {
    const res = await bot.getGroupFilesByFolder(groupId.value, folderId)
    const list: FileItem[] = []

    // 处理文件夹
    if (res.folders) {
      list.push(...res.folders.map(f => ({
        id: f.folder_id,
        name: f.folder_name,
        type: 'folder' as const,
        uploader: f.creator_name,
        count: f.total_file_count
      })))
    }
    // 处理文件
    if (res.files) {
      list.push(...res.files.map(f => ({
        id: f.file_id,
        name: f.file_name,
        type: 'file' as const,
        size: formatFileSize(f.file_size),
        uploader: f.uploader_name,
        busid: f.busid
      })))
    }
    items.value = list
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: '加载失败', detail: '无法获取文件列表', life: 3000 })
  } finally {
    loading.value = false
  }
}

const handleItemClick = (item: FileItem) => {
  if (item.type === 'folder') {
    pathStack.value.push({ id: item.id, name: item.name })
    loadFiles(item.id)
  } else {
    downloadFile(item)
  }
}

const downloadFile = async (item: FileItem) => {
  toast.add({ severity: 'info', summary: '正在获取链接...', life: 1000 })
  try {
    const res = await bot.getGroupFileUrl(groupId.value, item.id, item.busid)
    if (res && res.url) {
      window.open(res.url, '_blank')
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: '下载失败', detail: '链接获取失败', life: 3000 })
  }
}

const navigateTo = (index: number) => {
  if (index === -1) {
    pathStack.value = []
    loadFiles('/')
  } else if (index < pathStack.value.length - 1) {
    pathStack.value = pathStack.value.slice(0, index + 1)
    const current = pathStack.value[pathStack.value.length - 1]
    loadFiles(current.id)
  }
}

onMounted(() => {
  loadFiles('/')
})
</script>
