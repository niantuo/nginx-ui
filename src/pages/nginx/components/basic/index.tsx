/**
 * @author tuonian
 * @date 2023/7/5
 */
import {AdvanceInputConfigs, AutoForm, AutoTypeInputProps, FormColumnType} from 'planning-tools'
import {Button, FormInstance, Popover} from "antd";
import {EditOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {AutoFormFooterProps} from "planning-tools/dist/esm/Components/AutoForm/form";
import {NgxModuleData} from "../input.ts";
import './index.less'

export type OnChange = (values: any) => void

export type IContentProps<T = any> = {
  data: T
  onChange: OnChange
}

type IProps = {
  content: React.FC<IContentProps>
  columns?: FormColumnType[]
  renderLines: (values: any) => string[]
  renderHttpLines?: (values: any) =>string[]
  overlayClassName?: string
  labelCol?: number
}
export const NgxBasicInput = (
  {
    content: ContentComp,
    columns = [],
    renderLines,
      renderHttpLines,
    overlayClassName,
    labelCol = 6,
    value, onChange
  }: IProps & AutoTypeInputProps) => {

  const [data, setData] = useState<any>({})
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (value?.data) {
      setData(value.data || {})
    }
  }, [value])

  const triggerChange = (values: any) => {
    const lines = renderLines(values)
    onChange?.({
      data: values,
      lines: lines,
      http: renderHttpLines?.(values) || []
    } as NgxModuleData)
  }

  const onValuesChange = (values: any) => {
    const current = {...data, ...values}
    setData(current)
    setOpen(false)
    triggerChange(current)
  }

  const onSubmitData = async (form: FormInstance | null) => {
    if (!form) {
      return
    }
    const values = await form.validateFields();
    console.log('values', values);
    onValuesChange(values)
  }

  const renderFormFooter = ({formRef}: AutoFormFooterProps) => {
    return (<div className="form-btns">
      <Button onClick={() => onSubmitData(formRef.current as never)} type="primary">保存</Button>
      <Button onClick={() => setOpen(false)}>取消</Button>
    </div>)
  }

  const renderForm = () => {
    return (<AutoForm columns={columns}
                      formProps={{
                        labelCol: {span: labelCol}
                      }}
                      onlyFields={true}
                      footer={renderFormFooter}
                      data={data}/>)
  }

  return (<div className="popover-input">
    <ContentComp data={data} onChange={onValuesChange}/>
    <Popover destroyTooltipOnHide
             overlayClassName={`popover-popover ${overlayClassName || ''}`}
             placement="right"
             open={open}
             onOpenChange={o => setOpen(o)}
             trigger="click" content={renderForm}>
      <Button type="link" onClick={() => setOpen(true)} icon={<EditOutlined/>}/>
    </Popover>
  </div>)
}

/**
 * 注册自定义的输入框
 * @param type
 * @param Component
 */
export const registerInput = (type: string, Component: React.FC<AutoTypeInputProps>) => AdvanceInputConfigs[type] = Component
