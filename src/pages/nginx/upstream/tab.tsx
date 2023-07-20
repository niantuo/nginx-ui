import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {INginx, INginxServer, IUpstream} from "../../../models/nginx.ts";
import {useAppDispatch, useAppSelector} from "../../../store";
import {FormTable, FormTableInstance, Message, TableRowData, uniqueKey} from "planning-tools";
import {Alert} from "antd";
import {NginxApis} from "../../../api/nginx.ts";
import './tab.less'
import {NginxActions} from "../../../store/slice/nginx.ts";
import ConfigData from './config.json'


const createUpstreamServer = (nginx: INginx, server?: INginxServer)=>{
    return {
        server_name: 'upstream',
        listen: 0,
        nginxId: nginx.id,
        upstreams: [],
        ...server,
        isUpstream: true,
    } as INginxServer
}

type IProps = {
    server?: INginxServer
    isStream?: boolean
}

export type ITabInstance = {
  onSyncData: ()=>Promise<boolean| any>
  onSaveData: () => Promise<any>
}
/**
 * 给他伪装成server来操作
 * @constructor
 */
export const UpstreamTab = forwardRef<ITabInstance, IProps>(({server, isStream}, ref)=> {

    const nginx = useAppSelector(state => state.nginx.current)
    const [data,setData] = useState<(IUpstream & TableRowData)[]>([])

    const dispatch = useAppDispatch()
  const formRef = useRef<FormTableInstance>()
    useEffect(()=>{
        const upstreams = server?.upstreams;
        if (Array.isArray(upstreams) && upstreams.length){
          const items =upstreams.map((item: any)=>{
            if (!item.key){
              item.key = uniqueKey(20)
            }
            return item
          })
            setData(items)
        }else {
            setData([])
        }
    },[server])

  const onSubmitData = async ()=>{
    if (!formRef.current || !nginx){
      return
    }
    const results: any[] = await formRef.current.onSyncSubmit(true)
    console.log('results', results)
    const serverData = createUpstreamServer(nginx, server);
    serverData.upstreams = results;
    serverData.isStream = !!isStream;
    serverData.isUpstream = true
    serverData.enable = true
    return serverData
  }


    const onSaveData = async ()=>{
      if (!nginx){
        return
      }
      const serverData = await onSubmitData()
      if (!serverData){
        return
      }
      return NginxApis.updateServer(nginx,serverData)
            .then((data)=>{
                delete serverData.confData;
                dispatch(NginxActions.updateUpstream({...serverData, id: data.id }))
                Message.success('save success!')
            })
            .catch(e=>{
                console.log('updateServer fail',e)
                Message.error(e.msg || e.message)
            })
    }

    useImperativeHandle(ref,()=>{
      return {
        onSaveData,
        onSyncData: onSubmitData
      }
    })

    const onAddRow = async (record: any) => {
      record.key = uniqueKey(20)
      if (!record.servers){
        record.servers = []
      }
      return record
    }


    return (<div className="page upstream-tab">
        <div className="page-container">
          <Alert type="warning" closable={true} message="负载均衡分为http和stream(TCP/UDP),如果服务列表为空，将忽略该配置" />
          <FormTable data={data}
                     operationProps={{
                       singleRowEdit: true,
                       onAddRow,
                     }}
                     ref={formRef as never}
                     columns={ConfigData.columns} />
        </div>
    </div>)
})
