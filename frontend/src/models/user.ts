/**
 * 用户
 */
export type User = {
    id: number
    account: string
    nickname: string
    roles?: string
    remark?: string
    /**
     * 缓存时间
     */
    timestamp: number
}