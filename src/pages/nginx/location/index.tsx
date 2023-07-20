/**
 * @author tuonian
 * @date 2023/6/29
 */
import {useNavigate, useParams} from "react-router";
import {NginxRouteParams} from "../types.ts";
import {useAppDispatch, useAppSelector} from "../../../store";
import {Button, Modal, Spin} from "antd";
import {useEffect, useRef, useState} from "react";
import {AutoForm, AutoFormInstance, Message, uniqueKey} from "planning-tools";
import {INginxServer, PLocation} from "../../../models/nginx.ts";
import {useFormConfig} from "../config.tsx";
import {NginxActions} from "../../../store/slice/nginx.ts";
import {nginxPrefix, serverIndexRoute} from "../../../routes/routes";
import {NavLink} from "react-router-dom";
import {cloneDeep} from "lodash";
import {NginxApis} from "../../../api/nginx.ts";

type Props ={
  isAdd?: boolean
}
export const ServerLocation = ({isAdd}: Props) => {

  const nginx = useAppSelector(state => state.nginx.current)
  const server = useAppSelector(state => state.nginx.server);
  const [location, setLocation] = useState<PLocation>()
  const [loading,setLoading] = useState(false)

  const params = useParams<NginxRouteParams>()
  const [modal,contextHolder] = Modal.useModal()

  const formRef = useRef<AutoFormInstance>()

  const formConfig = useFormConfig()

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(()=>{
    if (!server ){
      return
    }
    if (isAdd){
      setLocation({})
      formRef.current?.setData({id: uniqueKey(20)})
    }else if (params.locId && params.locId !== location?.id){
      const loc = server.locations?.find(l=>l.id === params.locId);
      setLocation(loc)
      formRef.current?.setData({...loc})
      console.log('location data', loc)
    }
  },[server, params.locId])

  const onSave =async () => {
    if (!server || !nginx?.id){
      return
    }
    const resp = await formRef.current?.onSyncSubmit(true);
    const data = { ...location, ...resp, nginxId: nginx.id};
    if (!data.id){
      data.id = uniqueKey(20)
    }
    const postData = cloneDeep(server) as INginxServer;
    if (!postData.locations){
      postData.locations = []
    }
    if (isAdd){
      postData.locations.push(data)
    }else {
      postData.locations = postData.locations.map(item=>{
        if (item.id == data.id){
          return { ...item, ...data}
        }
        return item
      })
    }
   onSaveData(!!isAdd,false,postData)
  }

  const onSaveData = (isAdd: boolean, isRemove: boolean, postData: INginxServer)=>{
    if (!nginx?.id){
      Message.error('system error，current nginx id is zero')
      return
    }
    setLoading(true);
    NginxApis.updateServer(nginx, postData)
      .then(()=>{
        dispatch(NginxActions.updateServer({
          id: postData.id,
          locations: postData.locations
        }))
        if (isAdd){
          setLocation({})
          formRef.current?.setData({})
        }else if (isRemove){
          navigate(serverIndexRoute(postData.nginxId,postData.id), { replace: true } )
        }
        Message.success("success!")
      })
      .catch(e=>{
        Message.error(e.msg || e.message)
      })
      .finally(()=>{
        setLoading(false)
      })
  }

  const onRemove = ()=>{
    if (isAdd || !server || !nginx){
      return
    }
    modal.confirm({
      title: '警告',
      content: '您确定要删除该规则吗？删除之后不可恢复，请谨慎操作',
      okText: '确认删除',
      cancelText: '暂时不了',
      okType: 'danger',
      onOk: ()=>{
        const locations = (server.locations || []).filter(item=>item.id !== location?.id);
        const postData = {...server,locations }
        onSaveData(false,true, postData)
      }
    })
  }
  if (!nginx){
    return null
  }
  if (!server){
    return <div className="page error">
      该虚拟主机不存在或者已被删除，<NavLink to={nginxPrefix(nginx.id)} >返回</NavLink>
    </div>
  }

  if (!location){
    return <div className="page error">
      该规则不存在或者已被删除，<NavLink to={serverIndexRoute(nginx.id, server.id)} >返回</NavLink>
    </div>
  }

  return (<div className="page">
    <div className="page-header">
      {
        isAdd ? "新增规则": "编辑规则"
      }
    </div>
    <div className="page-container">
      {
        server && location ? (  <AutoForm
          ref={formRef as any}
          columns={formConfig.location}
          data={location}
          onlyFields={true}
        />): <Spin />
      }
      <div className="page-footer">
        <Button loading={loading} type="primary" onClick={onSave}>保存</Button>
        <Button loading={loading} hidden={isAdd} onClick={onRemove} danger >删除</Button>
      </div>
    </div>
    {contextHolder}
  </div>)
}
