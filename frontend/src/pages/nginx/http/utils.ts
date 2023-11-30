import {isBoolean, isNull, isObject} from "lodash";
import {INginx} from "../../../models/nginx.ts";
import {isBasicData} from "planning-tools";
import {isNgxModuleValue, NgxModuleData} from "../components/input.ts";

const excludeKeys =["other","tmp","temp","key","proxy_settings"]

/**
 * 对一些特殊的值做一些特别的处理
 */
const valueProcessor: {[key:string]: (value:any) => string |string[]} = {
    log_format: (values: any[]) => {
        return values.map(v=>`${v.name}     ${v.content}`)
    },
}

/**
 * 以.分割key，重新组织结构
 * @param parent 给定上级的对象
 * @param pKey 上级的key, 包含后面的. ,比如一个完整的key 为 http.log_format.name ,则该值依次为 “”，http.,http.log_format.
 * @param key 当前级的key,以上为例，则依次为 http.log_format.name，log_format.name， name
 * @param values 所有的values，全部是键值对，不考虑嵌套的情况
 */
const fillChildValues = (parent: any, pKey:string, key: string, values:any) => {
    const dot = key.indexOf('.')
    if (dot > 0 && dot <key.length-1){
        const isFill = values[`${pKey}${key}`];
        if (isFill || isNull(isFill)){
            const firstKey = key.substring(0,dot)
            const childKey = key.substring(dot+1)
            let pValue: any =parent[firstKey];
            if (!pValue || !isObject(pValue)){
                pValue = {}
            }
            parent[firstKey] = pValue;
            fillChildValues(pValue,`${pKey}${firstKey}.`,childKey, values)
        }else {
            console.log('[http] skip key ', pKey,key, isFill)
        }
    }else {
        let kv =  values[`${pKey}${key}`]
        if (isNull(kv)){
            return
        }
        if (valueProcessor[key]){
            kv = valueProcessor[key](kv)
        }else if (isBoolean(kv)){
            kv = kv ? 'on':'off'
        }
        parent[key] = kv;
    }
}

/**
 * 有遇见以层级分结构的，比如http.abc,则判断有无http的值，如果为false，则跳过该顶级字段
 * @param values
 */
const toNginxObj = (values: any) => {
    const nginxObj: any = {};
    Object.keys(values).forEach(k=>{
        if (excludeKeys.indexOf(k) > -1){
            return
        }
        const value = values[k];
        if (isNull(value)){
            return;
        }
        fillChildValues(nginxObj,"",k,values)
    })
    return nginxObj
}

/**
 * 将值增加到lines里面
 * @param prefix
 * @param lines
 * @param key
 * @param value
 */
export const append2Lines = (prefix: string,lines: string[],key: string, value: any)=>{
  // NgxModuleData , lines必须包含分号;
  if (isNgxModuleValue(value)){
    (value as NgxModuleData).lines?.forEach((line:string)=>{
      lines.push(`${prefix}${line}`)
    })
  }else if (isBasicData(value)){
    lines.push(`${prefix}${key}  ${value};`)
  }else if (Array.isArray(value)){
    value.forEach((line:string)=>{
      lines.push(`${prefix}${key}  ${line};`)
    })
  }else {
    console.log('[render http], skip for ', key, value)
  }
}
export const toNginxConf = ( nginx: INginx, data: any)=>{
    const nginxObj: any = toNginxObj(data)
    console.log('toNginxConf', data, nginxObj)
    const lines: string[] = [];
    lines.push(`user  ${nginxObj.user || 'nginx'};`)
    lines.push(`worker_processes  ${nginxObj.worker_processes || 'auto'};`)
    if (isNgxModuleValue(nginxObj.error_log)){
        const logData = nginxObj.error_log as NgxModuleData;
        logData.lines?.forEach(line=>lines.push(line))
    }
    lines.push(`pid        ${nginxObj.pid || '/var/run/nginx.pid'};`)
    lines.push(`events {`)
    if (nginxObj.events){
        Object.keys(nginxObj.events).forEach(k=>{
          const value = nginxObj.events[k]
          append2Lines('    ', lines,k,value)
        })
    }
    lines.push('}')
    lines.push(`http {`)
    if (nginxObj.http){
        Object.keys(nginxObj.http).forEach(k=>{
          const value: any = nginxObj.http[k] as never
          if (k === 'more'){
              (value ?? '').split('\n').filter((item:string)=>!!item).forEach((line: string)=>{
                  lines.push(`    ${line}`)
              })
            return;
          }
          if (isNull(value)){
            return
          }
          append2Lines('    ', lines, k,value)
        })
    }

    lines.push(`    include ${nginx.dataDir}/conf.d/*.conf;`)
    // lines.push(`    include ${nginx.nginxDir}/conf.d/*.conf;`)
    lines.push('}')

  if (data.stream){
    lines.push(`stream {`)
    if (nginxObj.stream){
      Object.keys(nginxObj.stream).forEach(k=>{
        const value = nginxObj.stream[k]
        append2Lines(`    `, lines,k,value)
      })
      lines.push(`    include ${nginx.dataDir}/stream.d/*.conf;`)
      // lines.push(`    include ${nginx.nginxDir}/stream.d/*.conf;`)
    }
    lines.push('}')
  }
    return lines.join('\n')
}

