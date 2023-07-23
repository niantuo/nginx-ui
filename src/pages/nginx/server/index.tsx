/**
 * @author tuonian
 * @date 2023/6/29
 */
import {Button, Modal} from "antd";
import {useEffect, useRef, useState} from "react";
import {useAppDispatch, useAppSelector} from "../../../store";
import './index.less'
import {NginxActions} from "../../../store/slice/nginx.ts";
import {AutoForm, AutoFormInstance, Message} from "planning-tools";
import {cloneDeep} from "lodash";
import {useNavigate} from "react-router";
import {nginxPrefix} from "../../../routes/routes";
import {useFormConfig} from "../config.tsx";
import {NavLink} from "react-router-dom";
import {NginxApis} from "../../../api/nginx.ts";
import {INginxServer} from "../../../models/nginx.ts";
import {ServerPreviewConf} from "./components/preview.tsx";
import {SyncButton} from "./components/SyncButton.tsx";


export const NginxServer = () => {

  const current = useAppSelector(state => state.nginx.current);
  const server = useAppSelector(state => state.nginx.server);
  const servers = useAppSelector(state => state.nginx.servers)
  const formRef = useRef<AutoFormInstance>()

  const [modal, contextHolder] = Modal.useModal();
  const navigate = useNavigate();

  const formConfig = useFormConfig()
  const [loading,setLoading] = useState(false)

  const dispatch = useAppDispatch();

  useEffect(()=>{
    if (server && formRef.current){
      formRef.current?.setData(cloneDeep(server))
    }else {
      formRef.current?.setData({})
    }
  },[server])


  const onSubmitData = async ()=>{
    const resp = await formRef.current?.onSyncSubmit(true);
    return {...server, ...resp} as INginxServer
  }

  const onSave = async () => {
    if (!current?.id || !server){
      return
    }
    const data = await onSubmitData()
    delete data.confData;
    dispatch(NginxActions.updateServer(data))
    setLoading(true)
    NginxApis.updateServer(current, data)
      .then(()=>{
        console.log('data', data)
        console.log('onSave res', server);
        Message.success("success")
      })
      .catch(e=>{
        Message.error(e.msg || e.message)
      })
      .finally(()=>{
        setLoading(false)
      })
    return server;
  }

  const removeServer = () => {
    if (!current || !server){
      return
    }

    const removeServer = cloneDeep(server)
    removeServer.nginxId = current.id
    const handlerDelete = ()=>{
      setLoading(true)
      NginxApis.deleteServer(current.id,removeServer)
          .then(()=>{
            const list = servers.filter(s=>s.id !== removeServer.id);
            dispatch(NginxActions.updateServers(list))
            navigate(nginxPrefix(current.id))
            Message.success('删除成功！')
          })
          .finally(()=>{
            setLoading(false)
          })
    }

    modal.confirm({
      title: '提醒',
      content: '您确定要删除改虚拟主机吗？删除操作不可恢复，请谨慎操作',
      okType: 'danger',
      okText: '仍要删除',
      cancelText: '再考虑下',
      onOk: handlerDelete
    })
  }

  if (!current){
    return null
  }
  if (!server){
    return (<div className="page nginx-server error">
      该虚拟主机不存在或者已被删除，<NavLink to={nginxPrefix(current.id)}>返回实例设置</NavLink>
    </div> )
  }

  return (<div className="page nginx-server">
    <div className="page-header">
      <h5 className="page-title">虚拟主机</h5>
      <div style={{flex:1}} />
      <ServerPreviewConf modal={true} server={server as any} />
      <SyncButton onSubmitData={onSubmitData} />
      <Button loading={loading} type="primary" onClick={onSave}>保存</Button>
      <Button danger type="primary" onClick={removeServer}>删除</Button>
    </div>
    <div className="page-container">
      <AutoForm
        ref={formRef as any}
        columns={formConfig.server as any}
        data={server}
        onlyFields={true}
       />
    </div>
    {contextHolder}
  </div>)
}
