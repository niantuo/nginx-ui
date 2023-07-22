import request from "./request.ts";
import {BaseResp, INginxCerts, IServerHost} from "../models/api.ts";
import {INginx, INginxServer} from "../models/nginx.ts";
import {createServer, createServerHost} from "../pages/nginx/utils/nginx.ts";


type RefreshHttpData = {
  id: number
  httpConf: string
  httpData: string
}


export const NginxApis= {

  findAll: () => request.get<BaseResp<INginx[]>>('/nginx'),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  updateOrAdd: (data: Partial<INginx>) => request.post<BaseResp<INginx>>('/nginx', data, { disableErrorMsg: true, timeout: 60000 } as any),
  /**
   * 同步配置文件到本地，仅需要传递id  和httpConf, httpData 三个参数
   * @param nginx
   */
  refreshHttp: (nginx: RefreshHttpData) => {
    return request.post('/http/refresh', nginx, { timeout: 60000 })
  },
  getNginx: (id:number) => request.get<BaseResp<{nginx: INginx, servers: IServerHost[]}>>(`/nginx/${id}`),
  delNginx: (id:number) => request.delete(`/nginx/${id}`),
  /**
   * 不更改配置文件，仅保存数据，方便某些特殊情况，一直手动修改配置文件
   * @param nginx
   * @param server
   */
  // add or update
  updateServer: (nginx: INginx,server: Partial<INginxServer>) => {
    const serverHost: Partial<IServerHost> = createServerHost(nginx,server);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return request.post<BaseResp<IServerHost>>('/server',serverHost, { disableErrorMsg: true } as any)
      .then(({data})=>{
        if (data.data){
          return createServer(data.data)
        }
        return Promise.reject(data)
      })
  },
  /**
   * 更改配置文件，保存数据
   * @param nginx
   * @param server
   */
  refreshServer: (server: Partial<IServerHost>) => {
    return request.post('/server/refresh', server, { timeout: 60000 })
  },
  deleteServer: (server: INginxServer) => request.delete(`/server`,{ data: { id: server.id}}),
  status: (id:number) => request.post(`/nginx/${id}/status`, { }, { timeout: 60000 }),
  startNginx: (id:number) => request.post(`/nginx/${id}/start`, { }, { timeout: 60000 }),
  stopNginx: (id:number) => request.post(`/nginx/${id}/stop`, { }, { timeout: 60000 }),

  /**
   * 获取证书信息，不传name，则返回所有证书文件信息，传了name，则返回该证书的内容
   * @param id
   * @param name
   */
  getCerts: (id: number,name?: string) => request.get(`/nginx/${id}/certs`, { params: { name }}),
  /**
   * 保存证书信息
   * @param id
   * @param data
   */
  saveCerts: (id: number,data: INginxCerts) => request.post(`/nginx/${id}/certs`, data),
  delCerts: (nginxId: number,id: number) => request.delete(`/nginx/${nginxId}/certs`, { params: { id } }),
  /**
   * 从配置的数据目录中同步
   * @param id
   * @param name
   */
  syncCerts: (id: number) => request.post(`/nginx/${id}/certs/sync`),

}


export type IDeployReq  ={
  key: string
  nginxId: number
  /**
   * 部署目录，资源部署目录，一般是root+name 或者是alias
   */
  dir: string
  /**
   * 是否清空文件夹再部署
   */
  clear?: boolean
}
/**
 * 文件上传
 */
export const uploadApis = {
  uploadFile: (entry: FileSystemFileEntry, id: string) => {
    return new Promise<File>((resolve, reject) => {
      entry.file(function (f){
        resolve(f)
      },function (err){
        reject(err)
      })
    }).then(file=>{
      const formData = new FormData()
      formData.append("file", file)
      formData.append("Path", entry.fullPath)
      formData.append("Key", id)
      return request.post('/file',formData, {
        withCredentials: true,
        headers: {
          'Content-type' : 'multipart/form-data'
        }
      })
    })
  },
  deploy:(data: IDeployReq)=>request.post('/file/deploy', data, {timeout: 120000}),
}