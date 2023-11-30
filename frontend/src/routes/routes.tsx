import {INginx, INginxServer} from "../models/nginx.ts";
import {MenuProps} from "antd";

export const nginxPrefix = (id:string | number) =>`/nginx/${id}`
/**
 * nginx  server的首页
 * @param menuKey 菜单的key
 */
export const serverIndex = (menuKey: string) => `${menuKey}/conf`
export const serverRoute = (id: number| string,sid: number | string) => nginxPrefix(id) +`/server/${sid}`
export const serverIndexRoute = (id:number| string,sid: number| string) => nginxPrefix(id) +`/server/${sid}/conf`

/**
 * 放到这里来，跟上面的路径好对应起来，免得两个地方不一致，修改容易出错
 * @param nginx
 * @param servers 虚拟主机
 */
export const createNginxMenus = (nginx: INginx, servers: INginxServer[]= []) => {
  const prefix = nginxPrefix(nginx.id)
  const initialItems: MenuProps['items'] = [
    {
      label: '实例设置',
      key:`${prefix}`
    },
    {
      label: 'http配置',
      key: `${prefix}/http`,
    },
    {
      label: 'SSL证书',
      key: `${prefix}/certs`,
    },
    {
      label: '负载均衡',
      key: `${prefix}/upstream`,
    },
    {
      label: 'TCP/UDP',
      key: `${prefix}/stream`,
    },
  ]

  const serverMenu = {
    label: "虚拟主机",
    key: `no_route/${prefix}/servers`,
    children: [] as any[]
  }

  servers.forEach(s=>{
    if (s.isStream || s.isUpstream){
      return
    }
    let label = '';
    if (s.server_name){
      label = `${s.server_name}-${s.listen}(${s.ssl ? 'https': 'http'})`
    }
    serverMenu.children.push({
      label: label,
      key: `${prefix}/server/${s.id}`,
    })
  })

  serverMenu.children.push({
    label: '新增虚拟主机',
    key: `${prefix}/server-new`
  })

  initialItems.push(serverMenu)

  initialItems.push({
    label: "帮助",
    key: 'help'
  })

  return initialItems
}
