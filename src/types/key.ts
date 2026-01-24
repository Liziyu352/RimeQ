import type { InjectionKey, ComputedRef, Ref } from 'vue'
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
export const MsgCtxKey: InjectionKey<ComputedRef<{ groupId?: number; messageId: number; isMe: boolean }>> = Symbol('MsgCtx')

/** 搜索上下文 */
export const SearchKey: InjectionKey<Ref<string>> = Symbol('SearchKey')
