export type NginxRouteParams = {
  id: string // nginx id
  sid?: string // server id
  locId?: string // location id
}

/**
 * nginx.conf 的配置数据
 */
export type HttpConfData = {
    /**
     * http的日志格式
     */
    'http.log_format': {
        name: string;
        content?: string
    }[]
    'stream.log_format': {
        name: string;
        content?: string
    }[]
    [key:string]: any
}
