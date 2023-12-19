/**
 * @author tuonian
 * @date 2023/7/31
 */
import {IContentProps, NgxBasicInput, registerInput} from "../basic";
import {AutoTypeInputProps} from "planning-tools";

import CFG from './config.json'
import {Input, Popover} from "antd";
import './index.less'

export const AccessInput = (props: AutoTypeInputProps)=>{

    const renderMoreContent = (lines?: string[])=>{
        if (!lines?.length){
            return <span>无配置</span>
        }
        return (<Input.TextArea className="access-more-values"
                                rows={Math.min(10,lines.length)}
                                disabled value={lines.join('\n')} />)
    }

    const renderContent = (props: IContentProps) => {

        const lines = renderLines(props.data)

        return (
            <div className="ngx-access-input">
                <Popover
                    overlayClassName="more-conf-popover"
                    destroyTooltipOnHide content={()=>renderMoreContent(lines)}>
                    <span className="less-values">{lines.length ? lines.join(' ') : '无配置'}</span>
                </Popover>
            </div>
        )
    }

    const renderLines = (values: any)=>{
        const results: string[] = [];
        if (Array.isArray(values?.allow)){
            values.allow.forEach((item: any)=>{
                results.push(`allow    ${item.value};`)
            })
        }
        if (Array.isArray(values?.deny)){
            values.deny.forEach((item: any)=>{
                results.push(`deny    ${item.value};`)
            })
        }
        return results
    }

    return <NgxBasicInput renderLines={renderLines}
                          columns={CFG.form}
                          labelCol={4}
                          content={renderContent} {...props}/>
}

registerInput('access',AccessInput)
