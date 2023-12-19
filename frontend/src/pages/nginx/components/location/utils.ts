import {INginxLocation} from "../../../../models/nginx.ts";
import {cloneDeep} from "lodash";
import {isNgxModuleValue, NgxModuleData} from "../input.ts";
import {isBasicData} from "planning-tools";

/**
 * 临时数据，不渲染
 */
const blacklist: { [key:string]:boolean } = {
    'rewrite': true,
    'add_header': true,
    'id': true,
    'name': true,
    'proxy_type': true,
    'enable': true,
    "remark": true,
    "nginxId": true,
    "proxy_set_header": true,
    "__index__": true,
    "internal": true,
    "lines": true,
    http:true,
    data: true,
  'return': true, //需要特殊处理
}

/**
 * 这里暂时要考虑下
 * @param origin
 * @param httpLines
 */
export const renderLocation = (origin: INginxLocation) => {
    const loc = cloneDeep(origin)
    const lines: string[] = [];
    const httpLines: string[] = [];
    origin.lines = lines;
    origin.http = httpLines;

    lines.push('')
    lines.push(`####   ${loc.name || loc.id} start...`)
    lines.push(`location ${loc.match.regex || ''} ${loc.match.path || '/'} {`)

    if (loc.rewrite && loc.rewrite.replacement && loc.rewrite.regex){
        lines.push(`    rewrite ${loc.rewrite.regex} ${loc.rewrite.replacement} ${loc.rewrite.flag || 'permanent'};`)
    }

    (loc.add_header || []).forEach(h=>{
        lines.push(`    add_header ${h.name} ${h.value};`)
    })

    if (loc.proxy_type !=='proxy'){
        delete loc.proxy_settings
        delete loc.proxy_pass
        delete loc.proxy_set_header
        console.log('loc', loc)
    }

    if (loc.proxy_type !== 'static'){
        delete loc.root
        delete loc.alias
        delete loc.index
        delete loc.try_files
    }
    if (loc.proxy_type !== 'other'){
        delete loc.return
    }

    if (loc.internal){
        lines.push('    internal;');
    }
    delete loc.internal;


    Object.keys(loc).forEach(k=>{
        if (blacklist[k]){
            return;
        }
        if (k.startsWith("tmp" || k.startsWith("temp")) || k.startsWith("__")){
            return;
        }
        let value = (loc as any)[k];
        if (Array.isArray(value)){
            value = value.join(' ')
        }else if (isNgxModuleValue(value)){
            value.lines.forEach((line: string)=>{
                lines.push(`    ${line}`)
            });
            (value as NgxModuleData).http?.forEach(l=>httpLines.push(l))
            value = '';
        } else if (!isBasicData(value)){
            console.log('[render] skip',k, value)
            value = ''
        }
        if (value){
            lines.push(`    ${k}      ${value};`)
        }
    })

    if (loc.tmp_custom_config){
        loc.tmp_custom_config.split('\n').forEach(line=>{
            lines.push(`    ${line}`)
        })
    }

  if (loc.return?.code){
    let content = loc.return.content
    content = JSON.stringify(content)
    lines.push(`    return  ${loc.return.code || 200}   ${content};`)
  }

    lines.push('}')
    lines.push(`####   ${loc.name || loc.id} end...`)
    lines.push('')
    return lines
}
