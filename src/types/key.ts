import type { InjectionKey, ComputedRef } from 'vue'
import type { Message } from './event'

/** 交互上下文 */
export const ChatCtxKey: InjectionKey<{
  onInsertMention: (id: string, name: string) => void
  onPoke: (targetId: number) => void
  onContextMenu: (event: MouseEvent, msg: Message) => void
  onToggleSelect: (messageId: number) => void
  onReply: (msg: Message) => void
}> = Symbol('ChatCtx')

/** 消息上下文 */
export const MsgCtxKey: InjectionKey<ComputedRef<{
  groupId?: number
  messageId: number
  isMe: boolean
}>> = Symbol('MsgCtx')
