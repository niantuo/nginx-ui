/**
 * @author tuonian
 * @date 2023/7/5
 */
import {AutoTypeInputProps, isNull, uniqueKey} from 'planning-tools'
import './index.less'
import config from './config.json'
import {IContentProps, NgxBasicInput, registerInput} from "../basic";
import {Input, Tooltip} from "antd";

type DataType = {
  /**
   * 多域名时的随机key
   */
  key?: string
  origins?: string[]
  methods?: string[]
  headers?: string[]
  preflight?: boolean
  credentials?: boolean
  maxAge?: number
}

export const CorsInput = ({...props}: AutoTypeInputProps)=>{

  const ShowContent = ({data}: IContentProps<DataType>)=>{
    if (data.origins?.length && data.methods?.length){
      const lines = renderLines(data);
      const httpLines = renderHttpLines(data)
      let hint = ''
      if (httpLines.length){
        hint = '# map \n'+ httpLines.join('\n') +'\n'
      }
      hint +='# location\n'
      hint += lines.join('\n')

      return (<Tooltip
          destroyTooltipOnHide
          overlayClassName="cors-config-overlay"
          trigger="click"
          placement="topLeft"
          autoAdjustOverflow
          title={<Input.TextArea disabled rows={Math.min(10,lines.length + httpLines.length + 3)} value={hint} />}>
        <span className="config-status has-config">已配置</span>
      </Tooltip>)
    }
   return <span className="config-status">未完成配置</span>
  }

  const renderHttpLines = (values: DataType = {})=>{
    const lines: string[] = []
    if (!values.origins?.length){
      return lines
    }
    if (values.origins.length < 2){
      return lines
    }
    lines.push(`map  $http_origin ${values.key}  {`)
    lines.push(`    default 0;`)
    values.origins.forEach(host=>{
      lines.push(`    "~${host}"   ${host};`)
    })
    lines.push(`}`)
    return lines
  }

  const renderLines = (values: DataType = {})=>{
    const lines: string[] = []
    if (!values.key){
      values.key = `$cors_${uniqueKey(20)}`
    }
    if (!values.origins?.length){
      return lines
    }
    if (values.origins.length === 1){
      lines.push(`add_header 'Access-Control-Allow-Origin' '${values.origins[0]}';`)
    }else {
      lines.push(`add_header 'Access-Control-Allow-Origin' ${values.key};`)
    }

    if (values.methods?.length){
      lines.push(`add_header 'Access-Control-Allow-Methods' '${values.methods.join(',')}';`)
    }
    if (values.headers?.length){
      lines.push(`add_header 'Access-Control-Allow-Headers' '${values.headers.join(',')}';`)
    }
    if (!isNull(values.credentials)){
      lines.push(`add_header Access-Control-Allow-Credentials   '${values.credentials ? 'true': 'false'}';`)
    }
    if (!isNull(values.preflight)){
      lines.push(`if ($request_method = 'OPTIONS') {
        return 204;
 }`)
    }
    return lines;
  }

  return <NgxBasicInput
    {...props}
    columns={config.form}
    renderLines={renderLines}
    renderHttpLines={renderHttpLines}
    content={ShowContent}
    overlayClassName="cors-page-overlay"
    labelCol={4}
    />
}

registerInput('cors', CorsInput)

