/**
 * @author tuonian
 * @date 2023/7/5
 */
import {Button, Drawer, Input, Popover, Tooltip} from "antd";
import {AdvanceInputConfigs, AutoForm, AutoFormInstance, AutoTypeInputProps, isObject} from 'planning-tools'

import './index.less'
import {useEffect, useRef, useState} from "react";
import {EditOutlined} from "@ant-design/icons";
import {renderProxy} from "./utils.ts";
import {useAppSelector} from "../../../../store";
import FormConfig from './config.json'


export const ProxySettings = ({value, onChange}: AutoTypeInputProps) => {

  const nginx = useAppSelector(state => state.nginx.current)

  const [data,setData] = useState<any>()
  const [lines,setLines] = useState<string[]>([])
  const [open,setOpen] = useState(false)

  const formRef = useRef<AutoFormInstance>()

  useEffect(()=>{
    if (isObject(value)){
      setData(value.data)
      setLines(value.lines || [])
    }
    console.log('value change', value)
  },[value])

  const onSubmitData = async ()=>{
    if (!nginx?.id){
      return
    }
    const values = await formRef.current?.onSyncSubmit(true);
    const lines = renderProxy(values, nginx)
    const postData = {
      lines: lines,
      data:  values
    }
    onChange?.(postData)
    setOpen(false)
  }

  const renderMoreContent = ()=>{
    if (!lines?.length){
      return <span>无配置，点击编辑按钮编辑代理设置</span>
    }
    return (<Input.TextArea className="more-values"
                            rows={Math.min(10,lines.length)}
                            disabled value={lines.join('\n')} />)
  }

  return (<div className="proxy-settings-input">
    <Popover
             overlayClassName="more-conf-popover"
             destroyTooltipOnHide content={renderMoreContent}>
      <span className="less-values">{lines.length ? lines.join(' ; ') : '无配置'}</span>
    </Popover>
    <Button onClick={()=>setOpen(true)} type="link" icon={<EditOutlined />} />
    <Drawer title="代理设置"
            open={open}
            width={700}
            onClose={()=>setOpen(false)}
            rootClassName="proxy-drawer"
            extra={<>
              <Tooltip placement="rightBottom" title="提交后，请点击界面保存按钮，保存到服务器">
                <Button onClick={onSubmitData} type="primary">提交</Button>
              </Tooltip>

               </>}
            >

      <AutoForm ref={formRef as never}
                formProps={{
                    labelCol:{span: 7}
                }}
                data={data}
                columns={FormConfig.form} />
    </Drawer>
    </div>)
}

AdvanceInputConfigs["proxy_settings"] =ProxySettings
