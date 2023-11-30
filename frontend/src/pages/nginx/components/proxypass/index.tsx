/**
 * 必须要兼容，手动输入，以及选择负载均衡名字
 * @author tuonian
 * @date 2023/7/4
 */
import {AutoTypeInputProps, AdvanceInputConfigs} from "planning-tools";
import {Input, Select} from "antd";
import {useAppSelector} from "../../../../store";
import {ChangeEvent, useEffect, useMemo, useState} from "react";
import './index.less'

const protocols = [{value:"http", label:"http"},{ value: 'https',label: 'https'}]

/**
 * proxy_pass 或者fastcgi_pass .后者没有协议
 * @param value
 * @param onChange
 * @param column
 * @constructor
 */
export const ProxyPassInput = ({value, onChange, column}: AutoTypeInputProps)=>{

  const upstreamServer = useAppSelector(state => state.nginx.upstream);

  const [data,setData] = useState<string>()
  const [protocol,setProtocol] = useState<string>("http")

    const hideProtocol = useMemo(()=>{
        return (column as any).hideProtocol;
    },[column])

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
    if (!value || typeof value !=='string'){
      setData(undefined)
      return
    }
    if (value.startsWith('https://')){
      setProtocol('https')
    }else if (value.startsWith('http://')){
      setProtocol('http')
    }
    const pass = value.replace(/http(s)?:\/\//,'');
    if (pass){
      setData(pass)
    }
  },[value])

  const triggerChange = (pro: string,host?: string)=>{
    if (!pro || !host){
      return
    }
    if (hideProtocol){
        onChange?.(host)
    }else {
        const pass = `${pro}://${host}`
        onChange?.(pass)
    }
  }

  const onProtocolChange = (pro: string)=>{
    setProtocol(pro)
    triggerChange(pro,data)
  }

  const onSelectUpstream = (v?:string)=>{
    if (v){
      const val = v + (hideProtocol ? '': '/')
      setData(val)
      triggerChange(protocol,val)
    }
  }

  const userInputChange = (e: ChangeEvent<any>) =>{
    const v = e.currentTarget.value;
    setData(v);
    triggerChange(protocol,v)
  }



  return (<div className="proxy-pass-input">
      {
          hideProtocol ? null: (
              <Select value={protocol}
                      onChange={onProtocolChange}
                      className="protocol" options={protocols} />
          )
      }
    <Input className="service-host-input" onChange={userInputChange} value={data} allowClear/>
    <Select onChange={onSelectUpstream}
            placeholder="选择负载均衡"
            allowClear
            className="upstream-select"
            options={options} />
    </div>)
}

AdvanceInputConfigs['proxy_pass'] = ProxyPassInput
