/**
 * 必须要兼容，手动输入，以及选择负载均衡名字
 * @author tuonian
 * @date 2023/7/4
 */
import {AutoTypeInputProps, AdvanceInputConfigs} from "planning-tools";
import {Button, Input, Popover, Select} from "antd";
import {useAppSelector} from "../../../../store";
import {ChangeEvent, useEffect, useMemo, useState} from "react";
import {EditOutlined} from "@ant-design/icons";

import './index.less'

export const StreamProxyPassInput = ({value, onChange}: AutoTypeInputProps)=>{

  const upstreamServer = useAppSelector(state => state.nginx.streamUpstream);
  const [data,setData] = useState<string>()


  const options = useMemo(()=>{
    let list:any[] = []
    if (upstreamServer?.upstreams){
      list =  upstreamServer.upstreams.map(item=>{
        return {
          label: item.name,
          value: item.name
        }
      })
    }
    return list
  },[upstreamServer])

  useEffect(()=>{
   setData(value)
  },[value])

  const onSelectUpstream = (v?:string)=>{
    if (v){
      setData(v)
      onChange?.(v)
    }
  }

  const onUserInput = (e:ChangeEvent<any>)=>{
    setData(e.currentTarget.value)
    onChange?.(e.currentTarget.value)
  }



  const renderInput = ()=>{
    return (<div className="proxy-pass-popover">
      <Input placeholder="输入后端服务的IP：PORT或者复制均衡名称" value={data} onChange={onUserInput} />
      <Select onChange={onSelectUpstream}
              placeholder="选择负载均衡"
              allowClear
              className="upstream-select"
              options={options} />
    </div>)
  }

  return (<>
    {data}
    <Popover trigger="click" destroyTooltipOnHide content={renderInput}>
      <Button type="link" icon={<EditOutlined />} />
    </Popover>
  </>)
}

AdvanceInputConfigs['stream_proxy_pass'] = StreamProxyPassInput
