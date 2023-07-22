/**
 * 后端返回数据的基本格式
 */
export type BaseResp<T =any> = {
  code: number
  msg: string
  data?: T
}

/**
 * 虚拟主机，后端，跟前端不一致
 */
export type IServerHost = {
  id: number
  name: string
  nginxId: number
  enable?: boolean
  serverData: string
  serverConf: string
  remark: string
  /**
   * 是否为TCP/UDP代理
   */
  isStream?: boolean
}

/**
 * 证书信息
 */
export type INginxCerts = {
  id: number
  nginxId: number
  serviceName: string
  subjectName?: string
  hintMsg?: string
  pem: string
  key: string
  createdAt?: string
  expiresAt?: string
  remark?: string
}
