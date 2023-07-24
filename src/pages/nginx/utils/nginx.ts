import {IServerHost} from "../../../models/api.ts";
import {INginx, INginxServer} from "../../../models/nginx.ts";
import {renderServer} from "./index.ts";
import {useAppDispatch, useAppSelector} from "../../../store";
import {NginxApis} from "../../../api/nginx.ts";
import {Notify} from "planning-tools";
import {NginxActions} from "../../../store/slice/nginx.ts";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router";

export const createServer = (host: IServerHost)=>{
  const server = JSON.parse(host.serverData) as INginxServer;
  server.id = host.id;
  server.nginxId = host.nginxId
  server.confData = host.serverConf;
  return server;
}

export const createServerHost = (nginx: INginx, server: Partial<INginxServer>)=>{
  const serverConf = renderServer(nginx,server);
  return  {
    name: `${server.server_name}_${server.listen}`,
    id: server.id,
    nginxId: nginx.id,
    enable: server.enable,
    serverConf: serverConf,
    serverData: JSON.stringify(server),
    remark: server.remark || '',
    isStream: server.isStream,
  }
}

export const useNginx = (id?: string)=>{
  const current = useAppSelector(state => state.nginx.current);
  const navigate = useNavigate();
  const [loading,setLoading] = useState(false)
  const dispatch = useAppDispatch()

  const toNginx = ()=>{
    if (!id){
      return
    }
    setLoading(true);
    NginxApis.getNginx(id)
        .then(({data})=>{
          const respData = data.data;
          if (!respData){
            Notify.warn('查询失败，请重试！');
            navigate('/')
            return
          }
          console.log('getNginx', data, loading)
          dispatch(NginxActions.setCurrent({
            nginx: respData.nginx,
            servers: respData.servers
          }))
        })
        .catch(e=>{
          Notify.warn(e.msg || e.message);
          navigate('/')
        })
        .finally(()=>{
          setLoading(false)
        })

  }

  useEffect(()=>{
    toNginx()
  },[id])
  return [current]
}