/**
 * @author tuonian
 * @date 2023/7/5
 */
import {AdvanceInputConfigs, AutoForm, AutoTypeInputProps, isNull} from 'planning-tools'
import {Button, FormInstance, Popover, Switch} from "antd";
import './index.less'
import {EditOutlined} from "@ant-design/icons";
import {useEffect, useState} from "react";
import config from './config.json'
import {AutoFormFooterProps} from "planning-tools/dist/esm/Components/AutoForm/form";
import {isBoolean} from "lodash";
import {NgxModuleData} from "../input.ts";

export const GzipInput = ({value, onChange}:AutoTypeInputProps) => {

  const [data,setData] = useState<any>({})
  const [open,setOpen] = useState(false)

  useEffect(()=>{
    if (value?.data){
      setData(value.data || {})
    }
  },[value])

  const onSwitch = (checked: boolean)=>{
    const values = { ...data,gzip: checked}
    setData(values)
    triggerChange(values)
  }

  const triggerChange = (values: any)=>{
    const lines:string[] = []
    if (data?.gzip){
      lines.push(`gzip      on;`)
      Object.keys(values).forEach(k=>{
        let v = values[k];
        if (isNull(v) || k ==='gzip'){
          return
        }
        if (Array.isArray(v)){
          v = v.join(' ')
        }else if (isBoolean(v)){
          v = v ? 'on' : 'off'
        }
        lines.push(`${k}  ${v};`)
      })
    }
    onChange?.({
      data: values,
      lines
    } as NgxModuleData)
  }

  const onSubmitData =async (form: FormInstance | null)=>{
    if (!form){
      return
    }
    const values = await form.validateFields();
    console.log('values', values);
    const current = { ...data, ...values }
    setData(current)
    setOpen(false)
    triggerChange(current)
  }

  const renderFormFooter = ({formRef}:AutoFormFooterProps)=>{
    return (<div style={{textAlign: 'center'}}>
      <Button onClick={()=>onSubmitData(formRef.current as never)} type="primary">保存</Button>
      <Button onClick={()=>setOpen(false)}>取消</Button>
    </div>)
  }

  const renderForm = ()=>{
    return (<AutoForm columns={config.form}
                      formProps={{
                        labelCol: {span: 6}
                      }}
                      onlyFields={true}
                      footer={renderFormFooter}
                      data={data} />)
  }

  return (<div className="gzip-input">
    <Switch onChange={onSwitch} checked={data.gzip} />
    <Popover destroyTooltipOnHide overlayClassName="gzip-popover"
             placement="right"
             open={open}
             onOpenChange={o=>setOpen(o)}
             trigger="click" content={renderForm}>
      <Button onClick={()=>setOpen(true)} hidden={!data.gzip} type="link" icon={<EditOutlined />} />
    </Popover>

  </div>)
}

AdvanceInputConfigs['gzip'] = GzipInput
