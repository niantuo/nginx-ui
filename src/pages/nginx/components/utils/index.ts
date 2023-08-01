import {isBasicData, isNull} from "planning-tools";
import {IRenderProcessor, isNameValue, isNgxModuleValue, NgxModuleData, KeyValue, ProcessorData} from "../input.ts";
import {isBoolean} from "lodash";

/**
 * 渲染基础类型的数据，int，string，bool
 * @param lines
 * @param k
 * @param value
 */
export const renderBasicData = (lines: string[], k: string, value: any)=>{
    if (!isBasicData(value)){
        return false
    }
    if (isBoolean(value)){
        value = value ? 'on': 'off'
    }
    lines.push(`${k}      ${value};`)
    return true
}


/**
 * 自定义输入项的通用渲染规则,
 * @param values
 * @param processor 自定义渲染方法，仅能处理一级，别搞多
 */
export const renderInputLines = (values: any, processor?: IRenderProcessor) => {
    console.log('renderLines',values)
    const lines: string[] = [];
    const httpLines:string[] = [];
    Object.keys(values).forEach(k=>{
        let value = values[k];
        if (isNull(value)){
            return;
        }
        const processData: ProcessorData = {
            lines,
            httpLines,
            key: k,
            value: value
        }
        if (processor?.(processData)){
            return;
        }
        if (isNgxModuleValue(value)){
            const ngxData = value as NgxModuleData
            ngxData.lines?.forEach((item: string)=>lines.push(`${item}`))
            ngxData.http?.forEach(line=>httpLines.push(line))
            return;
        }

        if (renderBasicData(lines,k,value)){
            return;
        }
        if (Array.isArray(value) && value.length){
            const firstValue = value[0]
            if (isNgxModuleValue(firstValue)){
                value.forEach((data: NgxModuleData)=>{
                    data.http?.forEach(line=>httpLines.push(line))
                    data.lines?.forEach(line=>lines.push(`${line}`))
                })
            }else if (isNameValue(firstValue)){
                value.forEach((data: KeyValue)=>{
                    lines.push(`${data.name}      ${data.value};`)
                })
            }else if (isBasicData(firstValue)){
                value = value.join(' ')
                lines.push(`${k}      ${value};`)
            }
        }else {
            console.warn('data format not valid', k, value)
        }
    })
    return { lines, httpLines}
}
