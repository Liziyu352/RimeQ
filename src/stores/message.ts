import { ref, shallowRef, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { bot } from '@/api'
import { database, type DBMessage } from './database'
import { useSessionStore } from './session'
import { useSettingStore } from './setting'
import { useContactStore } from './contact'
import { type Message, type Notice, PostType, SegType } from '@/types'
import { formatDuration } from '@/utils/format'

/**
 * 消息状态管理 Store
 * @description 负责消息的存储、加载、实时更新及多选和回复等功能
 */
export const useMessageStore = defineStore('message', () => {
  const sessionStore = useSessionStore()
  const settingStore = useSettingStore()
  const contactStore = useContactStore()

  /** 上次活跃时间 */
  const lastActiveTime = useStorage('rimeq-last-active', Date.now())
  /** 当前激活的会话 ID */
  const activeId = ref('')
  /** 当前展示的消息列表 */
  const messages = shallowRef<DBMessage[]>([])
  /** 是否正在加载消息 */
  const isLoading = ref(false)
  /** 是否已加载完历史消息 */
  const isLoaded = ref(false)
  /** 是否开启多选模式 */
  const isMultiSelect = ref(false)
  /** 选中的消息 ID 集合 */
  const selectedIds = ref<number[]>([])
  /** 转发目标 ID 列表 */
  const forwardTargets = ref<string[]>([])
  /** 正在回复的目标消息 */
  const replyTarget = ref<Message | null>(null)

  /**
   * 获取当前多选选中的消息对象列表
   */
  const selectedMessages = computed((): DBMessage[] => {
    if (!selectedIds.value.length) return []
    const set = new Set(selectedIds.value)
    return messages.value.filter(m => set.has(m.message_id))
  })

  /**
   * 根据 ID 获取会话类型
   * @param id - 会话 ID
   * @returns 会话类型 ('group' | 'private')
   */
  const getSessionType = (id: string): 'group' | 'private' => {
    const session = sessionStore.getSession(id)
    if (session) return session.type
    const isGroup = contactStore.checkIsGroup(id)
    return isGroup ? 'group' : 'private'
  }

  /**
   * 生成统一的会话 ID
   * @param targetId - 目标 ID
   * @param type - 会话类型
   */
  const getSessionKey = (targetId: string, type: 'private' | 'group'): string => {
    return type === 'group' ? `g_${targetId}` : `p_${targetId}`
  }

  /**
   * 标准化消息对象
   * @param msg - 原始消息对象
   * @returns 标准化后的消息对象，包含 session_id 和 session_seq
   */
  const normalizeMessage = (msg: Message): DBMessage => {
    const seqSource = Number(msg.real_seq || msg.message_seq || msg.message_id || 0)
    const session_seq = (msg.time * 1000) + (Math.abs(seqSource) % 1000)
    const targetId = msg.message_type === 'group'
      ? msg.group_id
      : (msg.user_id === settingStore.user?.user_id ? msg.target_id : msg.user_id)
    const prefix = msg.message_type === 'group' ? 'g_' : 'p_'
    return { ...msg, session_seq, session_id: `${prefix}${targetId}`}
  }

  /**
   * 将新消息合并到当前视图
   * @param newMessages - 新消息列表
   */
  const mergeToView = (newMessages: DBMessage[]) => {
    if (newMessages.length === 0) return
    const currentIds = new Set(messages.value.map(m => m.message_id))
    const toAdd = newMessages.filter(m => !currentIds.has(m.message_id))
    if (toAdd.length > 0) {
      const merged = [...messages.value, ...toAdd]
      merged.sort((a, b) => a.session_seq - b.session_seq)
      messages.value = merged
      if (settingStore.config.debugMode) console.log('[Message] 消息排序结果:', messages.value)
    }
  }

  /**
   * 从本地数据库拉取历史消息
   * @param id 会话ID
   * @param beforeSeq 获取该序号之前的消息
   * @param count 数量
   */
  const fetchFromLocal = async (id: string, beforeSeq: number, count = 50): Promise<DBMessage[]> => {
    const type = getSessionType(id)
    const sessionKey = getSessionKey(id, type)
    const result = await database.messages
      .where('[session_id+session_seq]')
      .below([sessionKey, beforeSeq])
      .and(item => item.session_id === sessionKey)
      .reverse()
      .limit(count)
      .toArray()
    if (settingStore.config.debugMode) console.log('[Message] 读取本地历史:', result)
    return result
  }

  /**
   * 从云端 API 拉取历史消息
   * @param id 会话ID
   * @param startSeq 起始序号
   * @param count 数量
   */
  const fetchFromCloud = async (id: string, startSeq?: number, count = 50): Promise<DBMessage[]> => {
    if (!settingStore.isConnected) return []
    const type = getSessionType(id)
    let res: { messages: Message[] }
    try {
      res = await bot.getMsgHistory(type, Number(id), startSeq, count, true)
    } catch (e) {
      console.error('[Message] 拉取消息失败:', e)
      return []
    }
    const fetchedList = res.messages || []
    if (settingStore.config.debugMode) console.log('[Message] 请求消息历史:', fetchedList)
    if (fetchedList.length === 0) return []
    const normalized = fetchedList.map(m => normalizeMessage(m))
    await database.messages.bulkPut(normalized).catch(e => console.warn('[Message] 存储消息失败:', e))
    return normalized
  }

  /**
   * 切换并打开一个会话
   * @param id - 会话 ID
   */
  async function openSession(id: string): Promise<void> {
    if (activeId.value === id) return
    activeId.value = id
    isLoading.value = true
    isLoaded.value = false
    setMultiSelect()
    setReplyTarget(null)
    sessionStore.clearUnread(id)
    messages.value = []
    try {
      const now = Date.now()
      const timeDiff = now - lastActiveTime.value
      const isColdStart = timeDiff > 300 * 1000
      if (isColdStart) {
        const cloudMsgs = await fetchFromCloud(id, 0, 50)
        mergeToView(cloudMsgs)
      } else {
        const localMsgs = await fetchFromLocal(id, Number.MAX_SAFE_INTEGER, 50)
        messages.value = localMsgs.reverse()
        fetchFromCloud(id, 0, 50).then(cloudMsgs => {
          mergeToView(cloudMsgs)
        })
      }
      lastActiveTime.value = now
    } catch (e) {
      console.error('[Message] 打开会话失败:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 拉取历史消息
   * @param id - 会话 ID (默认为当前激活会话)
   * @returns 是否成功获取并合并了新数据
   */
  async function fetchHistory(id: string = activeId.value): Promise<boolean> {
    if (id !== activeId.value) return false
    if (isLoading.value && messages.value.length > 0) return false
    if (isLoaded.value) return false
    isLoading.value = true
    let hasNewData = false
    try {
      const oldestMsg = messages.value[0]
      const currentSeq = oldestMsg ? oldestMsg.session_seq : Number.MAX_SAFE_INTEGER
      let candidates = await fetchFromLocal(id, currentSeq, 50)
      let isDiscontinuous = false
      if (candidates.length === 0) {
        isDiscontinuous = true
      } else if (oldestMsg) {
        const firstCandidate = candidates[0]
        if (firstCandidate) {
          const gap = currentSeq - firstCandidate.session_seq
          if (gap > 300 * 1000) isDiscontinuous = true
        }
      }
      if (isDiscontinuous && settingStore.isConnected) {
        const apiCursor = oldestMsg ? oldestMsg.message_seq : undefined
        const cloudData = await fetchFromCloud(id, apiCursor, 50)
        if (cloudData.length > 0) candidates = cloudData
      }
      if (candidates.length > 0) {
        mergeToView(candidates)
        hasNewData = true
      } else {
        isLoaded.value = true
      }
    } catch (e) {
      console.error(`[Message] 拉取消息 ${id} 历史失败:`, e)
    } finally {
      isLoading.value = false
    }
    return hasNewData
  }

  /**
   * 接收实时消息推送
   * @param rawEvent - 原始消息事件
   */
  function pushMessage(rawEvent: Message): void {
    const processed = normalizeMessage(rawEvent)
    database.messages.put(processed).catch(e => console.warn('[Message] 存储消息失败:', e))
    if (activeId.value) {
      const activeSession = sessionStore.getSession(activeId.value)
      let activeKey = ''
      if (activeSession) {
         activeKey = getSessionKey(activeId.value, activeSession.type)
      } else {
         const type = rawEvent.message_type === 'group' ? 'group' : 'private'
         activeKey = getSessionKey(activeId.value, type)
      }
      if (activeKey === processed.session_id) {
        if (!messages.value.some(m => m.message_id === processed.message_id)) {
          messages.value = [...messages.value, processed]
        }
      }
    }
    lastActiveTime.value = Date.now()
  }

  /**
   * 将通知事件转换为系统消息
   * @param notice 通知事件
   */
  function convertToMessage(notice: Notice) {
    let text = ''
    let targetId: string | number = 0
    let targetType: 'group' | 'private' = 'group'
    switch (notice.notice_type) {
      case 'friend_add': {
        targetId = notice.user_id
        targetType = 'private'
        text = `你和 ${contactStore.getUserName(notice.user_id)} 已成功添加为好友`
        break
      }
      case 'group_increase': {
        targetId = notice.group_id
        const userName = contactStore.getUserName(notice.user_id, notice.group_id)
        if (notice.sub_type === 'invite' || notice.user_id !== notice.operator_id) {
          const operatorName = contactStore.getUserName(notice.operator_id, notice.group_id)
          text = `${operatorName} 邀请 ${userName} 加入了群聊`
        } else {
          text = `${userName} 加入了群聊`
        }
        break
      }
      case 'group_decrease': {
        targetId = notice.group_id
        const userName = contactStore.getUserName(notice.user_id, notice.group_id)
        if (notice.sub_type === 'leave') {
          text = `${userName} 退出了群聊`
        } else {
          const operatorName = contactStore.getUserName(notice.operator_id, notice.group_id)
          text = `${userName} 被 ${operatorName} 移出了群聊`
        }
        break
      }
      case 'group_admin': {
        targetId = notice.group_id
        const userName = contactStore.getUserName(notice.user_id, notice.group_id)
        text = `${userName} 被${notice.sub_type === 'set' ? '设为' : '取消'}了管理员`
        break
      }
      case 'group_ban': {
        targetId = notice.group_id
        const userName = contactStore.getUserName(notice.user_id, notice.group_id)
        const operatorName = contactStore.getUserName(notice.operator_id, notice.group_id)
        if (notice.duration > 0) {
          text = `${userName} 被 ${operatorName} 禁言 ${formatDuration(notice.duration)}`
        } else {
          text = `${userName} 被 ${operatorName} 解除禁言`
        }
        break
      }
      case 'notify': {
        if (notice.sub_type === 'poke') {
          const isGroup = !!notice.group_id
          targetId = isGroup ? notice.group_id! : (notice.user_id === settingStore.user?.user_id ? notice.target_id : notice.user_id)
          targetType = isGroup ? 'group' : 'private'
          const operatorName = contactStore.getUserName(notice.user_id, isGroup ? notice.group_id : undefined)
          const targetName = isGroup ? contactStore.getUserName(notice.target_id, notice.group_id) : '你'
          let actionText = '戳了戳'
          try {
            const rawInfo = notice.raw_info
            if (rawInfo && typeof rawInfo === 'string') {
            } else if (Array.isArray(rawInfo)) {
               const texts = rawInfo.filter((i: any) => i.type === 'nor' && i.txt).map((i: any) => i.txt)
               if (texts.length > 0) actionText = texts.join(' ')
            }
          } catch { /* ignore */ }
          text = `${operatorName} ${actionText} ${targetName}`
        } else if (notice.sub_type === 'lucky_king') {
          targetId = notice.group_id
          const luckyName = contactStore.getUserName(notice.target_id, notice.group_id)
          const senderName = contactStore.getUserName(notice.user_id, notice.group_id)
          text = `${senderName} 的红包被抢完，${luckyName} 是运气王`
        } else if (notice.sub_type === 'honor') {
          targetId = notice.group_id
          const userName = contactStore.getUserName(notice.user_id, notice.group_id)
          const honorMap: Record<string, string> = { talkative: '龙王', performer: '群聊之火', legend: '群聊炽焰', strong_newbie: '冒尖小春笋', emotion: '快乐源泉' }
          text = `恭喜 ${userName} 获得了 “${honorMap[notice.honor_type] || '荣誉'}”`
        } else if (notice.sub_type === 'title') {
          targetId = notice.group_id
          const userName = contactStore.getUserName(notice.user_id, notice.group_id)
          text = `恭喜 ${userName} 获得群主授予的 "${notice.title}" 头衔`
        }
        break
      }
    }
    if (!text || !targetId) return
    // 创建系统消息
    const systemMsg: Message = {
      time: notice.time,
      self_id: 0,
      post_type: PostType.Message,
      message_type: targetType,
      sub_type: 'normal',
      message_id: -Math.floor(Math.random() * 1000000),
      user_id: 10000,
      group_id: targetType === 'group' ? Number(targetId) : undefined,
      message: [{ type: SegType.Text, data: { text } }],
      raw_message: text,
      font: 0,
      sender: { user_id: 10000, nickname: '系统消息' }
    }
    if (settingStore.config.debugMode) console.log('[Message] 消息事件转换:', systemMsg)
    // 推送消息并更新会话
    pushMessage(systemMsg)
    sessionStore.updateSession(String(targetId), {
      type: targetType,
      preview: text,
      time: notice.time * 1000,
      unread: activeId.value === String(targetId) ? 0 : 1
    })
  }

  /**
   * 更新消息状态
   * @param notice - 包含消息更新的通知事件
   */
  async function updateMessage(notice: Notice) {
    let messageId: number | undefined
    const updates: Partial<Pick<DBMessage, 'essence' | 'reactions'>> = {}
    if (notice.notice_type === 'essence') {
      messageId = notice.message_id
      updates.essence = notice.sub_type === 'add'
    } else if (notice.notice_type === 'group_msg_emoji_like') {
      messageId = notice.message_id
      updates.reactions = notice.likes
    } else if (notice.notice_type === 'notify' && notice.sub_type === 'emoji_like') {
      messageId = notice.message_id
      updates.reactions = notice.likes
    }
    if (!messageId) return
    const updatedCount = await database.messages.where({ message_id: messageId }).modify(updates)
    // 更新视图
    if (updatedCount > 0) {
      const indexInView = messages.value.findIndex(m => m.message_id === messageId)
      if (indexInView !== -1) {
        const newMessages = [...messages.value]
        newMessages[indexInView] = Object.assign({}, newMessages[indexInView], updates)
        messages.value = newMessages
      }
    }
  }

  /**
   * 处理消息撤回
   * @param msgId - 消息 ID
   */
  async function recallMessage(msgId: number): Promise<void> {
    const dbMsg = await database.messages.where('message_id').equals(msgId).first()
    if (dbMsg) {
        dbMsg.recalled = true
        await database.messages.put(dbMsg)
    }
    const idx = messages.value.findIndex(m => m.message_id === msgId)
    if (idx !== -1) {
        const copy = [...messages.value]
        const target = copy[idx]
        if (target) {
            const updated = { ...target, recalled: true }
            copy[idx] = updated
            messages.value = copy
        }
    }
  }

  /**
   * 设置多选模式
   * @param id - 传入数字切换该消息选中状态；不传则关闭多选模式并清空
   */
  function setMultiSelect(id?: number): void {
    if (settingStore.config.debugMode) console.log('[Message] 设置多选目标:', id)
    if (id === undefined) {
      isMultiSelect.value = false
      selectedIds.value = []
      forwardTargets.value = []
      return
    }
    if (!isMultiSelect.value) {
      isMultiSelect.value = true
      setReplyTarget(null)
    }
    const idx = selectedIds.value.indexOf(id)
    if (idx > -1) selectedIds.value.splice(idx, 1)
    else selectedIds.value.push(id)
  }

  /**
   * 设置回复引用目标
   * @param message - 目标消息对象
   */
  function setReplyTarget(message: Message | null): void {
    if (settingStore.config.debugMode) console.log('[Message] 设置回复目标:', message?.message_id)
    replyTarget.value = message
  }

  return { activeId, messages, isLoading, isLoaded, forwardTargets,
    isMultiSelect, selectedIds, selectedMessages, replyTarget,
    setMultiSelect, setReplyTarget, openSession, pushMessage,
    fetchHistory, convertToMessage, updateMessage, recallMessage }
})
