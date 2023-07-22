/**
 * @author tuonian
 * @date 2023/6/28
 */
import {INginxServer} from "../../../../models/nginx.ts";
import {Alert, Button, Input, Modal} from "antd";
import {useEffect, useState} from "react";
import {renderServer} from "../../utils";
import {Message, Notify} from "planning-tools";

import './preview.less'
import {useAppSelector} from "../../../../store";
import {createServerHost} from "../../utils/nginx.ts";
import {NginxApis} from "../../../../api/nginx.ts";


type Props = {
  modal?: boolean
  onGetData?: () => Promise<Partial<INginxServer>>
  server?: INginxServer
}
/**
 * server的预览+编辑
 * @param modal
 * @param server
 * @param onGetData
 * @constructor
 */
export const ServerPreviewConf = ({modal, server, onGetData}: Props) => {

  const [loading,setLoading] = useState(false)
  const [data,setData] = useState<Partial<INginxServer>>()
  const nginx = useAppSelector(state => state.nginx.current)

  const [value,setValue] = useState<string>()

  const openPreview = async ()=>{
    setLoading(true);
    try {
      const resp = await onGetData?.() || server
      setData(resp)
    }catch (e){
      console.log('[preview] fail',e)
      Notify.warn(`获取数据失败！`)
    }finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    if (!modal){
      setData(server)
    }
  },[server])

  const onRefresh = ()=>{
    if (!nginx?.id || !server?.id){
      return
    }
    const postData = createServerHost(nginx,server);
    if (value){
      postData.serverConf = value
    }
    setLoading(true)
    NginxApis.refreshServer(postData)
      .then(()=>{
        Message.success('sync success!')
      })
      .finally(()=>{
        setLoading(false)
      })
  }

  useEffect(()=>{
    if (!nginx?.id || !data){
      setValue(undefined)
    }else {
      const conf = renderServer(nginx,data)
      setValue(conf)
    }

  },[data, nginx])

  const renderConf = () => {
    return (<div className="preview-pane">
      <Alert type="warning" style={{marginBottom: 5}}
             closable={true}
             description={`在此处对配置文件的修改，将在虚拟主机通过界面操作"同步"功能后丢失，请注意`}></Alert>
      <Input.TextArea onChange={v=>setValue(v.currentTarget.value)} value={value} />
      <div className="ops">
        <Button onClick={onRefresh} danger type="primary">同步</Button>
        <Button onClick={()=>setData(undefined)}>取消</Button>
      </div>
    </div>)
  }

  if (modal){
    return  <>
      <Button loading={loading} onClick={()=>openPreview()}>配置文件</Button>
      <Modal
        open={!!data}
        footer={null}
        width="900px"
        className="preview-modal"
        onCancel={()=>setData(undefined)}
        maskClosable={false}
        title="配置文件">
        {renderConf()}
      </Modal>
    </>
  }

  return renderConf()

}
