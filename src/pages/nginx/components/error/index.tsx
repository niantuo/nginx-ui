/**
 * @author tuonian
 * @date 2023/7/5
 */
import {AutoTypeInputProps} from 'planning-tools'
import './index.less'
import config from './config.json'
import {IContentProps, NgxBasicInput, registerInput} from "../basic";

type ErrorPageData = {
  error_pages?: {
    /**
     * 处理的错误状态码
     */
    codes: string[]
    /**
     * 响应状态码
     */
    respCode?: string

    /**
     * 错误路由，或者命名路由
     */
    uri: string
  }[]
}

export const ErrorPageInput = ({...props}: AutoTypeInputProps)=>{

  const ShowContent = ({data}: IContentProps<ErrorPageData>)=>{
    const lines = renderLines(data);
    return (<div className="error-pages">
      {
      lines.map((line,index)=>(<div className="error-page-item" key={index}>{line}</div>))
      }
      {
        lines.length ? null : '未配置'
      }
    </div>)
  }

  const renderLines = (values: ErrorPageData = {})=>{
    const lines: string[] = []
    if (!values.error_pages || !values.error_pages.length){
      return lines
    }
    values.error_pages.forEach(item=>{
      if (!item.codes || item.codes.length ===0 || !item.uri){
        lines.push(`#error_page code or uri is empty, skip`)
        return
      }
      let text = `error_page  ${item.codes.join(' ')}`
      if (item.respCode){
        text += `  =${item.respCode}`
      }
      text +=`   ${item.uri};`
      lines.push(text)
    })
    return lines;
  }

  return <NgxBasicInput
    {...props}
    columns={config.form}
    renderLines={renderLines}
    content={ShowContent}
    overlayClassName="error-page-overlay"
    labelCol={0}
    />
}

registerInput('error_page', ErrorPageInput)

