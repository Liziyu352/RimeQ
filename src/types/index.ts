/**
 * 协议定义统一出口
 */
export * from './base'
export * from './data'
export * from './event'
export * from './segment'

// 上下文注入
import type { InjectionKey, Ref } from 'vue'

export const SearchKey: InjectionKey<Ref<string>> = Symbol('SearchKey')
