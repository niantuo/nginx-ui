/**
 * @author tuonian
 * @date 2023/7/31
 */
import {IContentProps, NgxBasicInput, registerInput} from "../basic";
import {AutoTypeInputProps} from "planning-tools";

import CFG from './config.json'
import {Input, Popover} from "antd";
import './index.less'
import {renderInputLines} from "../utils";
import {KeyValue, ProcessorData} from "../input.ts";

/**
 * 部分特殊字段的渲染
 */
const CustomRender = ({key, value, lines,}: ProcessorData) => {
    if (key ==='fastcgi_param' || key === 'more_settings'){
        (value as KeyValue[]).forEach(item=>{
            lines.push(`fastcgi_param  ${item.name}  ${item.value};`)
        })
        return true;
    }
    if (key === 'fastcgi_bind'){
        if (!value.address){
           return true
        }
        if (value.address =='off'){
            lines.push(`fastcgi_bind  off;`);
        }else {
            lines.push(`fastcgi_bind  ${value.address}  ${value.transparent ? 'transparent': ''};`)
        }
        return true
    }
    return false
}

export const FastcgiInput = (props: AutoTypeInputProps)=>{

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
            <div className="ngx-fastcgi-input">
                <Popover
                    overlayClassName="ngx-fastcgi-popover"
                    destroyTooltipOnHide content={()=>renderMoreContent(lines)}>
                    <span className="less-values">{lines.length ? lines.join(' ') : '无配置'}</span>
                </Popover>
            </div>
        )
    }

    const renderLines = (values: any)=>{
        const result = renderInputLines(values, CustomRender)
        return result.lines;
    }

    return <NgxBasicInput renderLines={renderLines}
                          columns={CFG.form}
                          labelCol={4}
                          drawer={true}
                          drawerProps={{
                              width: 650,
                              title: 'FastCGI'
                          }}
                          content={renderContent}
                          {...props}/>
}

registerInput('fastcgi',FastcgiInput)
