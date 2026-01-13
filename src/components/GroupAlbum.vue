<template>
  <div class="ui-flex-col-full bg-background-sub relative">
    <!-- 头部 -->
    <header class="h-14 shrink-0 px-4 border-b border-background-dim/50 flex items-center gap-3">
      <!-- 移动端返回 / 内部返回上一级 -->
      <Button
        icon="i-ri-arrow-left-s-line"
        text rounded
        class="!w-8 !h-8 !text-foreground-sub"
        @click="handleBack"
      />
      <div class="flex flex-col">
        <span class="font-bold text-base text-foreground-main">{{ currentAlbum ? currentAlbum.name : '群相册' }}</span>
        <span v-if="currentAlbum" class="text-[10px] text-foreground-dim">{{ photos.length }} 张图片</span>
      </div>
    </header>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto ui-scrollbar p-3">

      <!-- Loading 状态 -->
      <div v-if="loading" class="flex-center py-20 text-foreground-sub gap-2">
        <div class="i-ri-loader-4-line animate-spin text-xl" />
        <span class="text-sm">加载中...</span>
      </div>

      <!-- 视图 A: 相册列表 -->
      <div v-else-if="!currentAlbum" class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="album in albums"
          :key="album.album_id"
          class="aspect-square rounded-2xl bg-background-main border border-background-dim p-3 flex flex-col items-center justify-center cursor-pointer ui-trans hover:shadow-md hover:border-primary/50 group relative overflow-hidden"
          @click="openAlbum(album)"
        >
          <!-- 装饰背景 -->
          <div class="absolute -right-4 -bottom-4 text-8xl text-background-dim/50 opacity-20 group-hover:scale-110 ui-trans rotate-12">
            <div class="i-ri-gallery-fill" />
          </div>

          <!-- 图标 -->
          <div class="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 ui-flex-center text-2xl mb-2 group-hover:scale-110 ui-trans relative z-10">
            <div class="i-ri-image-2-line" />
          </div>

          <!-- 信息 -->
          <div class="text-center relative z-10 w-full px-2">
            <div class="text-sm font-bold text-foreground-main truncate">{{ album.name }}</div>
            <div class="text-xs text-foreground-sub mt-1">{{ album.upload_number }} 张</div>
          </div>
        </div>

        <!-- 空状态 (相册列表) -->
        <div v-if="albums.length === 0" class="col-span-full flex-col flex-center py-20 text-foreground-dim opacity-60">
          <div class="i-ri-gallery-line text-4xl mb-2" />
          <span class="text-sm">暂无相册</span>
        </div>
      </div>

      <!-- 视图 B: 照片列表 -->
      <div v-else class="grid grid-cols-3 gap-1">
        <div
          v-for="(photo, index) in photos"
          :key="index"
          class="aspect-square bg-background-dim/30 relative group overflow-hidden cursor-pointer"
          @click="previewPhoto(photo.url)"
        >
          <img
            :src="photo.url"
            class="size-full object-cover ui-trans group-hover:scale-105"
            loading="lazy"
          />
        </div>

        <!-- 空状态 (照片列表) -->
        <div v-if="photos.length === 0" class="col-span-full flex-col flex-center py-20 text-foreground-dim opacity-60">
          <div class="i-ri-image-line text-4xl mb-2" />
          <span class="text-sm">相册为空</span>
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
import type { GroupAlbum } from '@/types'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const groupId = computed(() => Number(route.params.id))
const loading = ref(false)

// 数据状态
const albums = ref<GroupAlbum[]>([])
const currentAlbum = ref<GroupAlbum | null>(null)
const photos = ref<{ url: string }[]>([])

// 获取相册列表
const loadAlbums = async () => {
  if (!groupId.value) return
  loading.value = true
  try {
    const res = await bot.getGroupAlbumList(groupId.value)
    // 根据后端不同，res 可能直接是数组或包含 list 属性
    albums.value = Array.isArray(res) ? res : (res as any).list || []
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: '加载失败', detail: '无法获取相册列表', life: 3000 })
  } finally {
    loading.value = false
  }
}

// 打开特定相册
const openAlbum = async (album: GroupAlbum) => {
  currentAlbum.value = album
  photos.value = []
  loading.value = true
  try {
    const res = await bot.getGroupAlbumMediaList(groupId.value, album.album_id)
    // 适配不同后端的返回结构，通常是 list 或 data
    const list = Array.isArray(res) ? res : (res as any).list || (res as any).data || []

    // 数据标准化：确保有 url 字段
    photos.value = list.map((item: any) => ({
      url: item.url || item.pre_url || '' // 优先取大图，没有则取预览图
    })).filter((p: any) => !!p.url)
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: '加载失败', detail: '无法获取照片', life: 3000 })
  } finally {
    loading.value = false
  }
}

// 预览图片 (复用全局 MediaViewer)
const previewPhoto = (url: string) => {
  router.push({ query: { ...route.query, view: url } })
}

// 返回逻辑
const handleBack = () => {
  if (currentAlbum.value) {
    // 如果在相册详情页，返回相册列表
    currentAlbum.value = null
    photos.value = []
  } else {
    // 如果在列表页，返回上一页（聊天页）
    router.back()
  }
}

onMounted(() => {
  loadAlbums()
})
</script>
