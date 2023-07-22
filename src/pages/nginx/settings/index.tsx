/**
 * @author tuonian
 * @date 2023/6/29
 */
import {useFormConfig} from "../config.tsx";
import {AutoForm, AutoFormInstance, Message, Notify} from "planning-tools";
import {useAppDispatch, useAppSelector} from "../../../store";
import {useEffect, useRef, useState} from "react";
import {INginx} from "../../../models/nginx.ts";
import {cloneDeep} from "lodash";
import {Alert, Button, Form, Tag} from "antd";
import {NginxApis} from "../../../api/nginx.ts";
import {NginxActions} from "../../../store/slice/nginx.ts";
import {NgxVersionData, parseVersionInfo} from "./utils.ts";

import './index.less'

export const NginxSettings = () => {

  const formConfig = useFormConfig()
  const [data, setData] = useState<Partial<INginx>>({})
  const current = useAppSelector(state => state.nginx.current);
  const [versionData,setVersionData] = useState<NgxVersionData>()

  const formRef = useRef<AutoFormInstance>()
  const [loading,setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState<string>()

  const dispatch = useAppDispatch()

  const saveData = async () =>{
    const values = await formRef.current?.onSyncSubmit(true);
    setLoading(true);
    const postData = { ...data, ...values };
    delete postData.servers;
    NginxApis.updateOrAdd(postData)
      .then(({data: resp})=>{
        if (resp.data){
          dispatch(NginxActions.updateNginx(resp.data))
        }
        Message.success('保存成功！');
        setErrMsg(undefined)
      })
      .catch(e=>{
        if (e.code == 1){
          Notify.warn(`实例添加成功，但环境检查失败：${e.msg || e.message}`);
          setErrMsg(e.msg || e.message)
        }else {
          Notify.warn(e.msg || e.message)
        }
      })
      .finally(()=>{
        setLoading(false)
      })

  }

  useEffect(()=>{
    if (current){
      const newData = cloneDeep(current);
      setData(newData)
      formRef.current?.setData(newData)
      const parseData = parseVersionInfo(newData.versionInfo)
      setVersionData(parseData)
      if (parseData.sbin && parseData.sbin !== newData.nginxPath){
        Notify.warn(`您配置的nginx路径(${newData.nginxPath})跟实际(${parseData.sbin})的不一直，请检查！`)
      }
      if (parseData.prefix && parseData.prefix != newData.nginxDir){
        Notify.warn(`您配置的配置目录(${newData.nginxDir})跟实际(${parseData.prefix})不一致，请检查核实！`)
      }
    }
  },[current])

  const columns = formConfig.addNginx.concat(formConfig.nginxSettings)

  return (<div className="page">
    <div className="page-header">
      <span>Nginx基础配置</span>
      <Button danger loading={loading} onClick={saveData}>保存</Button>
    </div>
    <div className="page-container">
      {
        errMsg ? <Alert onClose={()=>setErrMsg(undefined)} type="warning" closable={true} message={errMsg} /> : null
      }
      <AutoForm
        ref={formRef as never}
        data={data}
        columns={columns}
        onlyFields={true} />

      {
        versionData ? (
            <div className="version-parse">
              <h5>版本信息</h5>
              <Form.Item labelCol={{span: 4}} className="version-item" label="版本">
                <span>{versionData.versionInfo}</span>
              </Form.Item>
              <Form.Item labelCol={{span: 4}} className="version-item" label="支持模块">
                {
                  versionData.modules.map(name=>(<Tag key={name}>{name}</Tag>))
                }
              </Form.Item>
              <Form.Item labelCol={{span: 4}} className="version-item" label="其它参数">
                {
                  versionData.args.map(arg=>(<Tag key={arg}>{arg}</Tag>))
                }
              </Form.Item>
            </div>
        ): null
      }
      <div className="page-footer">

      </div>
    </div>
  </div>)
}
