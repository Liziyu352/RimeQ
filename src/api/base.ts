import { socket } from './socket'
import type * as T from '@/types'

/** 后端类型 */
export type BackendType = 'NapCat' | 'Lagrange' | 'LLOneBot'

/**
 * OneBot v11 标准 API 客户端
 * @description 标准协议定义的基础方法
 */
export class BaseClient {
  public backend: BackendType = 'NapCat'

  /**
   * 设置后端类型
   * @param type - 后端类型
   */
  setBackend(type: BackendType) {
    this.backend = type
  }

  /**
   * 发送通用请求
   * @param action - API 动作名称
   * @param params - 请求参数
   * @returns Promise 解析后的响应数据
   */
  protected request<R>(action: string, params: Record<string, any> = {}): Promise<R> {
    return socket.request<R>(action, params)
  }

  // ============================================================================
  // 消息相关 (Message)
  // ============================================================================

  /**
   * 发送消息
   * @param message_type - 消息类型
   * @param id - 对方 QQ 号或群号
   * @param message - 消息内容
   */
  sendMsg(message_type: 'private' | 'group', id: number, message: string | T.Segment[]) {
    if (this.backend === 'LLOneBot') {
      if (message_type === 'private') {
        return this.request<{ message_id: number }>('send_private_msg', { user_id: id, message: message });
      } else {
        return this.request<{ message_id: number }>('send_group_msg', { group_id: id, message: message });
      }
    }
    return this.request<{ message_id: number }>('send_msg', { message, ...(message_type === 'private' ? { user_id: id } : { group_id: id }) });
  }

  /**
   * 撤回消息
   * @param message_id - 消息 ID
   */
  deleteMsg(message_id: number) {
    return this.request<void>('delete_msg', { message_id })
  }

  /**
   * 获取消息详情
   * @param message_id - 消息 ID
   */
  getMsg(message_id: number) {
    return this.request<T.Message>('get_msg', { message_id })
  }

  /**
   * 获取合并转发消息
   * @param id - 合并转发 ID (NapCat/LLOneBot:"message_id" 或 Lagrange:"id")
   */
  getForwardMsg(id: string) {
    return this.request<{ message: T.Segment[] }>('get_forward_msg', this.backend === 'Lagrange' ? { id } : { message_id: id });
  }

  // ============================================================================
  // 好友相关 (Friend)
  // ============================================================================

  /**
   * 发送好友赞
   * @param user_id - 对方 QQ 号
   * @param times - 点赞次数
   */
  sendLike(user_id: number, times = 1) {
    return this.request<void>('send_like', { user_id, times })
  }

  /**
   * 处理好友请求
   * @param flag - 加好友请求的 flag
   * @param approve - 是否同意请求
   * @param reason - 好友备注 (NapCat/LLOneBot) 或 拒绝理由 (Lagrange)
   */
  setFriendAddRequest(flag: string, approve: boolean, reason = '') {
    return this.request<void>('set_friend_add_request', { flag, approve, ...(this.backend === 'Lagrange' ? { reason: reason } : { remark: reason }) });
  }

  /**
   * 获取陌生人信息
   * @param user_id - QQ 号
   * @param no_cache - 是否不使用缓存 (Lagrange)
   */
  getStrangerInfo(user_id: number, no_cache = false) {
    return this.request<T.StrangerInfo>('get_stranger_info', { user_id, no_cache })
  }

  /**
   * 获取好友列表
   * @returns 好友列表数组
   */
  getFriendList() {
    return this.request<T.FriendInfo[]>('get_friend_list')
  }

  // ============================================================================
  // 群组相关 (Group)
  // ============================================================================

  /**
   * 获取群信息
   * @param group_id - 群号
   * @param no_cache - 是否不使用缓存 (Lagrange)
   */
  getGroupInfo(group_id: number, no_cache = false) {
    return this.request<T.GroupInfo>('get_group_info', { group_id, no_cache })
  }

  /**
   * 获取群列表
   * @returns 群列表数组
   */
  getGroupList() {
    return this.request<T.GroupInfo[]>('get_group_list')
  }

  /**
   * 获取群成员信息
   * @param group_id - 群号
   * @param user_id - QQ 号
   * @param no_cache - 是否不使用缓存
   */
  getGroupMemberInfo(group_id: number, user_id: number, no_cache = false) {
    return this.request<T.GroupMemberInfo>('get_group_member_info', { group_id, user_id, no_cache })
  }

  /**
   * 获取群成员列表
   * @param group_id - 群号
   */
  getGroupMemberList(group_id: number) {
    return this.request<T.GroupMemberInfo[]>('get_group_member_list', { group_id })
  }

  /**
   * 获取群荣誉信息
   * @param group_id - 群号
   * @param type - 群荣誉类型
   */
  getGroupHonorInfo(group_id: number, type: 'all' | 'talkative' | 'performer' | 'legend' | 'strong_newbie' | 'emotion' = 'all') {
    return this.request<T.GroupHonorInfo>('get_group_honor_info', { group_id, type })
  }

  /**
   * 群组踢人
   * @param group_id - 群号
   * @param user_id - 要踢的 QQ 号
   * @param reject_add_request - 拒绝此人的加群请求
   */
  setGroupKick(group_id: number, user_id: number, reject_add_request = false) {
    return this.request<void>('set_group_kick', { group_id, user_id, reject_add_request })
  }

  /**
   * 群组单人禁言
   * @param group_id - 群号
   * @param user_id - 要禁言的 QQ 号
   * @param duration - 禁言时长，单位秒
   */
  setGroupBan(group_id: number, user_id: number, duration = 1800) {
    return this.request<void>('set_group_ban', { group_id, user_id, duration })
  }

  /**
   * 群组全员禁言
   * @param group_id - 群号
   * @param enable - 是否开启
   */
  setGroupWholeBan(group_id: number, enable = true) {
    return this.request<void>('set_group_whole_ban', { group_id, enable })
  }

  /**
   * 设置群管理员
   * @param group_id - 群号
   * @param user_id - 管理员 QQ
   * @param enable - 设置 / 取消
   */
  setGroupAdmin(group_id: number, user_id: number, enable = true) {
    return this.request<void>('set_group_admin', { group_id, user_id, enable })
  }

  /**
   * 设置群名片
   * @param group_id - 群号
   * @param user_id - 要设置的 QQ 号
   * @param card - 内容，为空表示取消
   */
  setGroupCard(group_id: number, user_id: number, card = '') {
    return this.request<void>('set_group_card', { group_id, user_id, card })
  }

  /**
   * 设置群名
   * @param group_id - 群号
   * @param group_name - 新群名
   */
  setGroupName(group_id: number, group_name: string) {
    return this.request<void>('set_group_name', { group_id, group_name })
  }

  /**
   * 退出群组
   * @param group_id - 群号
   * @param is_dismiss - 是否解散（仅群主） (NapCat/Lagrange)
   */
  setGroupLeave(group_id: number, is_dismiss = false) {
    return this.request<void>('set_group_leave', { group_id, is_dismiss })
  }

  /**
   * 设置群专属头衔
   * @param group_id - 群号
   * @param user_id - 要设置的 QQ 号
   * @param special_title - 专属头衔，为空表示取消
   * @param duration - 有效期，单位秒 (Lagrange)
   */
  setGroupSpecialTitle(group_id: number, user_id: number, special_title: string, duration = -1) {
    return this.request<void>('set_group_special_title', { group_id, user_id, special_title, duration })
  }

  /**
   * 处理加群请求
   * @param flag - 请求 flag
   * @param approve - 是否同意请求
   * @param reason - 拒绝理由
   */
  setGroupAddRequest(flag: string, approve: boolean, reason = '') {
    return this.request<void>('set_group_add_request', { flag, approve, reason })
  }

  // ============================================================================
  // Bot 自身相关 (Bot)
  // ============================================================================

  /**
   * 获取登录号信息
   */
  getLoginInfo() {
    return this.request<{ user_id: number; nickname: string }>('get_login_info')
  }

  /**
   * 获取 Cookies
   * @param domain - 需要获取 cookies 的域名
   */
  getCookies(domain = '') {
    return this.request<{ cookies: string; csrf_token: number | string; token?: number; bkn?: string | number }>('get_cookies', { domain })
  }

  /**
   * 获取 CSRF Token (NapCat/Lagrange)
   */
  getCsrfToken() {
    return this.request<{ token: number }>('get_csrf_token')
  }

  /**
   * 获取 QQ 相关接口凭证 (NapCat/Lagrange)
   * @param domain - 需要获取 cookies 的域名
   */
  getCredentials(domain = '') {
    return this.request<{ cookies: string; csrf_token: number | string; token?: number; bkn?: string | number }>('get_credentials', { domain })
  }

  /**
   * 获取语音
   * @param file - 语音文件名
   * @param out_format - 要转换到的格式 (mp3/amr/wma/m4a/spx/ogg/wav/flac)
   */
  getRecord(file: string, out_format = 'mp3') {
    return this.request<{ file: string }>('get_record', { file, out_format })
  }

  /**
   * 获取图片
   * @param file - 图片文件名
   */
  getImage(file: string) {
    return this.request<{ file: string }>('get_image', { file })
  }

  /**
   * 检查是否可以发送图片 (NapCat/Lagrange)
   */
  canSendImage() {
    return this.request<{ yes: boolean }>('can_send_image')
  }

  /**
   * 检查是否可以发送语音 (NapCat/Lagrange)
   */
  canSendRecord() {
    return this.request<{ yes: boolean }>('can_send_record')
  }

  /**
   * 获取运行状态
   */
  getStatus() {
    return this.request<{ online: boolean; good: boolean; stat?: any; plugins_good?: boolean }>('get_status')
  }

  /**
   * 获取版本信息
   */
  getVersionInfo() {
    return this.request<{ app_name: string; app_version: string; protocol_version: string; nt_protocol?: string }>('get_version_info')
  }

  /**
   * 重启 OneBot 实现 (Lagrange)
   */
  setRestart() {
    return this.request<void>('set_restart')
  }

  /**
   * 清理缓存 (NapCat/Lagrange)
   */
  cleanCache() {
    return this.request<void>('clean_cache')
  }
}
