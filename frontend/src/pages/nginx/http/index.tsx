/**
 * @author tuonian
 * @date 2023/6/29
 */
import {useFormConfig, useFormTemplate} from "../config.tsx";
import {AutoForm, AutoFormInstance, Message} from "planning-tools";
import {useEffect, useRef, useState} from "react";
import {Button, Tooltip} from "antd";
import {useAppDispatch, useAppSelector} from "../../../store";
import {cloneDeep} from "lodash";
import {NginxApis} from "../../../api/nginx.ts";
import {HttpConfSync} from "./components/HttpConfSync.tsx";
import {NginxActions} from "../../../store/slice/nginx.ts";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {toNginxConf} from "./utils.ts";

export const NginxHttp = () => {

  const formConfig = useFormConfig()
  const formTemplate = useFormTemplate();

  const [data,setData] = useState<any>({...formTemplate.nginxConf})
  const formRef = useRef<AutoFormInstance>()
  const nginx = useAppSelector(state => state.nginx.current);
  const [loading,setLoading] = useState(false)

  const dispatch = useAppDispatch()

    const onGetRealData = async ()=>{
        const values = await formRef.current?.onSyncSubmit(true);
        return  { ...data, ...values };
    }
  const onSubmitForm = async (sync?: boolean)=>{
    if (!nginx){
      return
    }
    const values = await formRef.current?.onSyncSubmit(true);
    const saveData = { ...data, ...values };
    console.log('saveData', saveData)
    setData(saveData)
    if (sync){
      onSyncHttpConf(saveData)
      return
    }

    const postData = cloneDeep(nginx);
    postData.httpData = JSON.stringify(saveData);
    postData.httpConf = "";
    setLoading(false)
    dispatch(NginxActions.updateNginx({ httpData: postData.httpData }))
    NginxApis.updateOrAdd(postData)
        .then(()=>{
          Message.success('保存成功！')
        })
        .finally(()=>{
          setLoading(false)
        })
  }


  /**
   * 将配置文件同步到服务器
   */
  const onSyncHttpConf = (nginxData: any) => {
    if (!nginx?.id){
      return
    }
    const nginxConf = toNginxConf(nginx, nginxData)
    const postData = {
      id: nginx.id,
      httpConf: nginxConf,
      // HttpData
      httpData: JSON.stringify(nginxData)
    }
    setLoading(true);
    dispatch(NginxActions.updateNginx(postData))
    NginxApis.refreshHttp(postData)
      .then(()=>{
        Message.success('sync success!');
      })
      .finally(()=>{
        setLoading(false)
      })
  }

  useEffect(()=>{
    try {
      const curData = nginx?.httpData ? JSON.parse(nginx.httpData) : {};
      const updateData = { ...formTemplate.nginxConf, ...curData };
      setData(updateData)
      formRef.current?.setData(updateData);
    }catch (e){
      console.log('parse httpData fail',e)
    }
  },[nginx,formTemplate])


  return (<div className="page">
    <div className="page-header">
      <span>nginx.conf配置</span>
      <div style={{flex:1}} />
      <HttpConfSync getRealData={onGetRealData} nginx={nginx} />
      <Button danger loading={loading} onClick={() => onSubmitForm(true)}>
        同步
        <Tooltip placement="left" title="同步配置文件到服务器,如果该server为禁用状态，将从服务器删除该配置文件">
          <QuestionCircleOutlined />
        </Tooltip>
      </Button>
      <Button loading={loading} onClick={()=>onSubmitForm(false)}>保存</Button>
    </div>
    <div className="page-container">
      <AutoForm ref={formRef as any} columns={formConfig.nginxConf} data={data} />
    </div>


  </div>)
}
