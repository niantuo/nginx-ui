/**
 * @author tuonian
 * @date 2023/7/5
 */
import {AutoTypeInputProps} from 'planning-tools'
import './index.less'
import config from './config.json'
import {IContentProps, NgxBasicInput, registerInput} from "../basic";
import {KeyValue} from "../../../../models/nginx.ts";

export const AuthInput = ({...props}: AutoTypeInputProps)=>{

  const ShowContent = ({data}: IContentProps)=>{
    return (<span>{data.auth_request_on ? data.auth_request_uri : '不启用'}</span>)
  }

  const renderLines = (values: any)=>{
    const lines: string[] = []
    if (!values.auth_request_on){
      return lines
    }
    lines.push(`auth_request  ${values.auth_request_uri};`)
    if (Array.isArray(values.auth_request_set)){
      values.auth_request_set.forEach((item: KeyValue)=>{
        lines.push(`auth_request_set  ${item.name}  ${item.value};`)
      })
    }
    return lines;
  }

  return <NgxBasicInput
    {...props}
    columns={config.form}
    renderLines={renderLines}
    content={ShowContent}
    />
}

registerInput('auth', AuthInput)

