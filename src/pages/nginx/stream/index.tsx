import {useAppDispatch, useAppSelector} from "../../../store";
import {useEffect, useRef, useState} from "react";
import {INginxServer, INginxStream} from "../../../models/nginx.ts";
import {cloneDeep} from "lodash";
import {useFormConfig} from "../config.tsx";
import { FormTable, FormTableInstance, Message} from "planning-tools";

import './index.less'
import {Button} from "antd";
import {NginxApis} from "../../../api/nginx.ts";
import {NginxActions} from "../../../store/slice/nginx.ts";
import {SyncButton} from "../server/components/SyncButton.tsx";


const createStreamServer = ()=>{
    return {
        id: 0,
        isStream: true,
        isUpstream: false,
        server_name: 'stream.all',
        listen: 0,
        locations: [],
        nginxId: 0,
        enable: true,
    } as INginxServer
}

/**
 * nginx 的steam的server
 * @constructor
 */
export const NginxStream = () => {

    const nginx = useAppSelector(state => state.nginx.current);
    const servers = useAppSelector(state => state.nginx.servers);

    const [data,setData] = useState<INginxStream[]>([])
    const [loading,setLoading] = useState(false)
  const streamServerRef = useRef<INginxServer>()

    const dispatch = useAppDispatch()

    const formConfig = useFormConfig();
    const formRef = useRef<FormTableInstance>()

    useEffect(()=>{
        const streamServer = servers.find(item=>item.isStream);
        if (streamServer){
            streamServerRef.current = streamServer
            setData(cloneDeep(streamServer.streams || []))
        }else {
            const newData = createStreamServer()
            newData.nginxId = nginx?.id || 0
          streamServerRef.current = newData
          setData([])
        }
    },[servers])

    const onSubmitData = async ()=>{
      const stream = streamServerRef.current;
        if (!stream || !nginx?.id){
            return false
        }
        const postData = cloneDeep(stream);
        postData.nginxId = nginx.id
        postData.enable = true
        let isOk = false
        try {
            const values = await formRef.current?.onSyncSubmit(true);
            console.log('values',values);
            postData.streams = values;
            isOk = true
        }catch (e: any){
            console.log('e',e);
            const errorFields = e.errorFields || [];
            if (errorFields.length){
                const errMsg = errorFields[0].errors[0]
                Message.warning(errMsg)
            }else {
                Message.warning('请检查配置，端口和后端服务为必填项，需要输入完整')
            }
        }
        if (isOk){
          return postData
        }
        return false
    }

    const onSave = async ()=>{
      if (!nginx?.id){
        return
      }
      const postData = await onSubmitData()
      if (!postData){
        return
      }
      setLoading(true)
      console.log('postData', postData)
      NginxApis.updateServer(nginx, postData)
        .then((data)=>{
          if (postData.id){
            dispatch(NginxActions.updateServer(data))
          }else {
            dispatch(NginxActions.addServer(data))
          }
          Message.success('save success！')
        })
        .catch(e=>{
          Message.warning(e.msg || e.message)
        })
        .finally(()=>{
          setLoading(false)
        })
    }

    return (<div className="page stream-page">
        <div className="page-header">
            <span>TCP/UDP</span>
            <div>
              <SyncButton onSubmitData={onSubmitData}/>
                <Button loading={loading} onClick={onSave} type="primary">保存</Button>
            </div>
        </div>
        <div className="page-container">
          <FormTable
            columns={formConfig.stream as any}
            data={data}
            ref={formRef as any}
            />
        </div>

    </div>)
}
