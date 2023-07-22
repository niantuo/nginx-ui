/**
 * @author tuonian
 * @date 2023/6/29
 */
import {useAppDispatch, useAppSelector} from "../../../store";
import {useRef, useState} from "react";
import {INginxServer, PNginxServer} from "../../../models/nginx.ts";
import {AutoForm, AutoFormInstance, Message, Notify} from "planning-tools";
import {Button} from "antd";

import './new.less'
import {NginxActions} from "../../../store/slice/nginx.ts";
import {useFormConfig, useFormTemplate} from "../config.tsx";
import {NginxApis} from "../../../api/nginx.ts";
import {cloneDeep} from "lodash";


export const NewServer = () => {
  const current = useAppSelector(state => state.nginx.current);
  const servers = useAppSelector(state => state.nginx.servers);


  const [loading, setLoading] = useState(false)


  const dispatch = useAppDispatch();

  const formRef = useRef<AutoFormInstance>()
  const formConfig = useFormConfig()
  const formTemplate = useFormTemplate()
  const [server,setServer] = useState<PNginxServer>(cloneDeep(formTemplate.server))

  const onSave = async () => {
    const resp = await formRef.current?.onSyncSubmit(true);
    const newServer = { ...server, ...resp} as INginxServer
    const key = `${newServer.server_name}-${newServer.listen}`
    for (const s of servers || []){
      const curKey = `${s.server_name}-${s.listen}`
      if (curKey == key){
        Notify.error("域名和端口重复，请更换域名或者端口！")
        return
      }
    }
    if (!current?.id){
      return
    }
    setLoading(true)
    NginxApis.updateServer(current, newServer)
      .then((data)=>{
        console.log('data', data)
        dispatch(NginxActions.updateServers([...servers as any, data]))
        setServer({})
        formRef.current?.setData({})
        Message.success("add success!")
      })
      .catch(e=>{
        Message.error(e.msg || e.message)
      })
      .finally(()=>{
        setLoading(false)
      })
  }

  return (<div className="server-new">
    <div className="server-new-header">
      <h5>新增虚拟主机</h5>
      <div style={{flex:1}} />
      <Button loading={loading} type="primary" onClick={onSave}>保存</Button>
    </div>
    <div className="server-new-container">
      <AutoForm
        ref={formRef as any}
        columns={formConfig.server as any}
        data={server}
        onlyFields={true}
        />
    </div>
  </div>)
}
