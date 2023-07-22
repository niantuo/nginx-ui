import {FormColumnType} from "planning-tools";
import {NgxModuleData} from "../pages/nginx/components/input.ts";

export type INginx = {
  id: number
  name: string
  uid: string
  /**
   * 数据目录，所有自定义配置文件都在里面
   * conf.d stream.d backup certs
   */
  dataDir: string
  /**
   * nginx的配置文件主目录，及nginx.conf 配置文件所在的目录
   */
  nginxDir: string
  /**
   * nginx可执行文件
   */
  nginxPath?:string
  isLocal: boolean
  ipAddr: string
  port: number
  user: string
  password: string
  httpData: string
  httpConf: string
  remark: string
  /**
   * 版本信息
   */
  versionInfo?: string
}

/**
 * 虚拟主机或者 TCP/UDP代理
 */
export type INginxServer = {
  /**
   * 唯一标识
   */
  id: number
  /**
   * 是否是负载均衡
   */
  isUpstream?: boolean
  /**
   * 是否为TCP/UDP代理
   */
  isStream?: boolean
  nginxId: number
  enable?: boolean
  http2?: boolean
  /**
   * 配置文件，当前的配置文件
   */
  confData?: string

  server_name: string
  listen: number
  ssl?: boolean
  charset?: string
  access_log?: string
  error_log?: string
  /**
   * 客户端最大的请求体大小，500m 1g
   */
  client_max_body_size?: string
  /**
   * 证书名称，平台托管的证书名称
   */
  certName?: string
  ssl_certificate?: string
  ssl_certificate_key?: string
  /**
   * eg. 5m 1h
   */
  ssl_session_timeout?: string
  // ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4
  ssl_ciphers?: string
  // TLSv1 TLSv1.1 TLSv1.2
  ssl_protocols?: string[]
  ssl_prefer_server_ciphers?: 'on'|'off'

  locations?: INginxLocation[]
  upstreams?: IUpstream[]
  streams?: INginxStream[]
  rewrite?: IRewrite
  remark?: string

  proxy_settings?: NgxModuleData
  tmp_custom_config?: string
  gzip?: NgxModuleData
}
/**
 * 负载均衡，跟虚拟主机放在一起吧，方便
 */
export type IUpstream = {
  name: string
  /**
   * weight\backup 不能和 ip_hash 关键字一起使用。
   * ip_hash 或者weight 轮训
   */
  type?:'ip_hash' | 'weight'
  /**
   * 是否启用
   */
  enable?: boolean
  servers: {
    host: string
    port: number
    weight?: number
    /**
     * down：表示当前的server暂时不参与负载
     * weight：默认为1.weight越大，负载的权重就越大。
     * backup： 其它所有的非backup机器down或者忙的时候，请求backup机器。所以这台机器压力会最轻。
     */
    status?: 'down' | 'backup' | 'normal'
    /**
     * 最大失败次数，也就是最多进行 3 次尝试，默认为1
     */
    max_fails?: number
    /**
     * 超时时间，单位秒，默认值是10s
     */
    fail_timeout?: number
  }[]
}

export type INginxStream = {
  /**
   * 唯一索引
   */
  key: string
  listen: number
  /**
   * 与被代理服务器建立连接的超时时间为5s
   */
  proxy_connect_timeout?: number
  /**
   * 获取被代理服务器的响应最大超时时间为10s
   */
  proxy_timeout?: number
  /**
   * 当被代理的服务器返回错误或超时时，将未返回响应的客户端连接请求传递给upstream中的下一个服务器
   */
  proxy_next_upstream?: boolean
  /**
   * 总尝试超时时间为10s
   */
  proxy_next_upstream_tries?: number
  /**
   *  总尝试超时时间为10s
   */
  proxy_next_upstream_timeout?: number
  /**
   * 开启SO_KEEPALIVE选项进行心跳检测
   */
  proxy_socket_keepalive?: boolean
  /**
   * proxy_pass
   */
  proxy_pass: string
  /**
   * 是否启用
   */
  enable?: boolean
}

export type PNginxServer = Partial<INginxServer>

/**
 * 键值对
 */
export type KeyValue = {
  name: string
  value: string
}

/**
 * nginx 的location配置
 */
export type INginxLocation = Omit<NgxModuleData, "data"> & {
  /**
   * 唯一标识
   */
  id: string
  /**
   * location的名称
   */
  name: string;
  /**
   * 匹配规则
   */
  match: {
    path: string
    regex?: string
  }
  index?: string
  root?: string
  alias?: string
  proxy_set_header?: IProxyHeader[]
  add_header?: IProxyHeader[]
  proxy_pass?: string
  // http_502 http_504 http_404 error timeout invalid_header
  proxy_next_upstream?: string[]
  //eg. 60s 1m
  proxy_connect_timeout?: string
  // 1.1
  proxy_http_version?: string
  rewrite?: IRewrite

  proxy_settings?: NgxModuleData
  gzip?: NgxModuleData
  tmp_custom_config?: string
  proxy_type?: 'proxy'| 'static' | 'returnBody' | 'other'
  /**
   * 是否为内部路由
   */
  internal?: boolean
  return?: {
    code: number
    content: string
  }
  /**
   * 临时数据，表示
   */
  __index__?: number
}

export type PLocation = Partial<INginxLocation>

export type IProxyHeader = {
  name: string
  value: string
}


export type IRewrite = {
  /**
   * 正则表达式
   */
  regex: string
  /**
   * 跳转后的内容
   */
  replacement: string
  /**
   * rewrite支持的flag标记
   */
  flag: 'last' | 'break' | 'redirect' | 'permanent'
}

/**
 * nginx的自动化表单配置
 */
export type INginxFormConfig = {
  server: FormColumnType[]
  location: FormColumnType[]
  addNginx: FormColumnType[]
  nginxSettings: FormColumnType[]
  nginxConf: FormColumnType[]
  /**
   * 负载均衡的
   */
  upstream: FormColumnType[]
  stream: FormColumnType[]
}

/**
 * 给定的初始值模板
 */
export type INginxFormTemplate = {
  server: Partial<INginxServer>,
  location: any,
  addNginx: any,
  nginxSettings: any,
  nginxConf: any
}
