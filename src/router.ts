import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useSettingStore } from '@/stores/setting'

// 视图组件
import ChatView from '@/views/Chat.vue'
import LoginView from '@/views/Login.vue'
import NoticeView from '@/views/Notice.vue'
import SessionList from '@/views/Session.vue'
import ContactList from '@/views/Contact.vue'
import SettingsView from '@/views/Settings.vue'

// 侧边栏组件
import GroupInfo from '@/components/GroupInfo.vue'
import GroupFile from '@/components/GroupFile.vue'
import GroupAlbum from '@/components/GroupAlbum.vue'
import GroupNotice from '@/components/GroupNotice.vue'
import GroupEssence from '@/components/GroupEssence.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    components: { default: LoginView, nav: SessionList },
    meta: { public: true, title: '登录' }
  },
  {
    path: '/settings',
    name: 'Settings',
    components: { default: SettingsView, nav: SessionList },
    meta: { title: '设置' }
  },
  {
    path: '/contact',
    name: 'Contact',
    components: { default: ChatView, nav: ContactList },
    meta: { title: '好友' }
  },
  {
    path: '/notice',
    name: 'Notice',
    components: { default: NoticeView, nav: ContactList },
    meta: { title: '通知' }
  },
  {
    path: '/:id/info',
    name: 'GroupInfo',
    components: { default: ChatView, nav: SessionList, sidebar: GroupInfo },
    meta: { title: '群信息' }
  },
  {
    path: '/:id/file',
    name: 'GroupFile',
    components: { default: ChatView, nav: SessionList, sidebar: GroupFile },
    meta: { title: '群文件' }
  },
  {
    path: '/:id/album',
    name: 'GroupAlbum',
    components: { default: ChatView, nav: SessionList, sidebar: GroupAlbum },
    meta: { title: '群相册' }
  },
  {
    path: '/:id/notice',
    name: 'GroupNotice',
    components: { default: ChatView, nav: SessionList, sidebar: GroupNotice },
    meta: { title: '群公告' }
  },
  {
    path: '/:id/essence',
    name: 'GroupEssence',
    components: { default: ChatView, nav: SessionList, sidebar: GroupEssence },
    meta: { title: '群精华' }
  },
  {
    path: '/:id?',
    name: 'Chat',
    components: { default: ChatView, nav: SessionList },
    meta: { title: '会话' }
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

/**
 * 路由守卫
 */
router.beforeEach((to, from, next) => {
  if (to.meta.title) document.title = `${to.meta.title} - RimeQ`
  const settingStore = useSettingStore()
  // 已登录
  if (settingStore.isLogged && to.name === 'Login') {
    return next('/')
  }
  // 未登录
  if (!settingStore.isLogged && !to.meta.public) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  next()
})
