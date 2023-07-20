/**
 * @author tuonian
 * @date 2023/7/6
 */
import {INginx} from "../../../../models/nginx.ts";
import {Button, Drawer, Input, Tooltip} from "antd";
import {ChangeEvent, useEffect, useState} from "react";
import './index.less'
import {SyncOutlined} from "@ant-design/icons";
import {NginxApis} from "../../../../api/nginx.ts";
import {useAppDispatch} from "../../../../store";
import {NginxActions} from "../../../../store/slice/nginx.ts";
import {Message} from "planning-tools";

type IProps = {
  nginx?: INginx
}
export const HttpConfSync = ({nginx}: IProps)=>{

  const [value,setValue] = useState<string>()
  const [open,setOpen] = useState(false)
  const [loading,setLoading] = useState(false)

  const dispatch = useAppDispatch()


  useEffect(()=>{
    setValue(nginx?.httpConf)
  },[nginx])

  const onChange = (evt: ChangeEvent<HTMLTextAreaElement>)=>{
    setValue(evt.currentTarget.value)
  }

  const onSubmitData = ()=>{
    if (!nginx?.id){
      return
    }
    setLoading(true);
    NginxApis.refreshHttp({ id: nginx.id, httpConf: value || '', httpData: nginx.httpData})
      .then(()=>{
        dispatch(NginxActions.updateNginx({...nginx, httpConf: value}))
        Message.success("success")
      })
      .finally(()=>{
        setLoading(false)
      })
  }

  if (!nginx?.id){
    return null
  }

  return (<>
    <Button onClick={()=>setOpen(true)}>配置文件</Button>
    <Drawer title="nginx.conf"
            open={open}
            destroyOnClose
            onClose={()=>setOpen(false)}
            width={750}
            className="nginx-conf-drawer"
            extra={<><Tooltip placement="leftBottom" title={`同步配置文件，注意：直接修改配置文件，将在界面操作“同步”功能后丢失`}>
              <Button loading={loading} onClick={onSubmitData} icon={<SyncOutlined />}/>
            </Tooltip></>}
            >
      <Input.TextArea onChange={onChange} value={value}  />
    </Drawer>
    </>)


}
