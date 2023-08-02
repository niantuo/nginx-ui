import {INginx, INginxServer} from "../../../models/nginx.ts";
import {isBasicData, isFalse, isNull} from "planning-tools";
import {cloneDeep, isBoolean} from "lodash";
import {isNgxModuleValue, NgxModuleData} from "../components/input.ts";

/**
 * 这些key需要单独处理，或者不是nginx的配置信息
 */
const serverBlacklist:{[key:string]:boolean} = {
  'listen': true,
  'ssl': true,
  'locations': true,
  "rewrite": true,
  "server_name": true,
  "id": true,
  "nginxId": true,
  "confData": true,
  'enable': true,
  "remark": true,
  "certName": true,
  "port": true,
  "http2": true
}



/**
 * 选择upstream 负载均衡，单独一个配置文件
 * @param server
 */
export const renderUpstream = (server: Partial<INginxServer>) =>{
  const lines: string[]= [];
  lines.push(`### upstream    ${server.isStream ? 'stream': 'http'}`)
  server.upstreams?.forEach(up=>{
    if (!up.enable){
      return
    }
    const servers = (up.servers || []).filter(item=>!!item.weight)
    if (servers.length){
      lines.push(`upstream ${up.name} {`)
      if (up.type=='ip_hash'){
        lines.push(`    ip_hash;`)
      }
      servers.forEach(item=>{
        let weight = ''
        let status = ''
        if (up.type !== 'ip_hash'){
          weight = `weight=${item.weight}`
          status = isNull(item.status) || item.status =='normal' ? '' : (item.status || '')
        }
        const max_fails = item.max_fails ? `max_fails=${item.max_fails}` : ''
        const timeout = item.fail_timeout ? `fail_timeout=${item.fail_timeout}s` : ''
        lines.push(`    server  ${item.host}:${item.port} ${weight} ${status} ${max_fails}  ${timeout};`)
      })
      lines.push('}')
    }

  })
  return lines.join('\n')
}

export const renderStream = (server: Partial<INginxServer>) =>{
  const lines: string[]= [];
  lines.push(`### stream all`)

  const servers = server.streams|| []
  servers.forEach(server=>{
    if (!server.enable){
      return
    }
    lines.push(`    server {`)
    lines.push(`        listen ${server.listen};`)
    lines.push(`        proxy_pass ${server.proxy_pass};`)
    if (server.proxy_connect_timeout){
      lines.push(`        proxy_connect_timeout ${server.proxy_connect_timeout}s;`)
    }
    if (server.proxy_timeout){
      lines.push(`        proxy_timeout ${server.proxy_timeout}s;`)
    }
    if (server.proxy_next_upstream || isNull(server.proxy_next_upstream)){
      lines.push(`        proxy_next_upstream on;`)
    }else {
      lines.push(`        proxy_next_upstream off;`)
    }
    if (server.proxy_next_upstream_tries){
      lines.push(`        proxy_next_upstream_tries ${server.proxy_next_upstream_tries};`)
    }
    if (server.proxy_next_upstream_timeout){
      lines.push(`        proxy_next_upstream_timeout ${server.proxy_next_upstream_timeout}s;`)
    }
    if (server.proxy_socket_keepalive){
      lines.push(`        proxy_socket_keepalive on;`)
    }else {
      lines.push(`        proxy_socket_keepalive off;`)
    }
    lines.push('    }')
  })
  return lines.join('\n')
}

/**
 * 渲染server.conf
 * @param nginx
 * @param origin
 */
export const renderServer = (nginx: INginx,origin?: Partial<INginxServer>) => {
  if (!origin){
    return '### no data'
  }
  const server = cloneDeep(origin);
  if (server.isUpstream){
    return renderUpstream(server)
  }else if (server.isStream){
    return renderStream(server)
  }
  const lines: string[]= [];
  /**
   * 渲染到http模块，server前面
   */
  const httpLines: string[] = [];
  delete server.nginxId;
  delete server.confData;
  lines.push(`### ${server.server_name} ${server.listen} start...`)
  lines.push("server {")

  const http2 = server.http2;
  delete server.http2;
  const http2Conf =  http2 ? 'http2': '';

  if (server.ssl){
    lines.push(`    listen      ${server.listen}  ${http2Conf}   ssl;`)
    lines.push(`    listen      [::]:${server.listen}  ${http2Conf}   ssl;`)
  }else {
    lines.push(`    listen      ${server.listen}  ${http2Conf}   ;`)
    lines.push(`    listen      [::]:${server.listen}  ${http2Conf}  ;`)
  }
  lines.push(`    server_name ${server.server_name};`)

  let confDir = nginx.dataDir;
  if (!confDir){
    confDir = '/app/data'
  }
  if (confDir.endsWith('/')){
    confDir = confDir.substring(0,confDir.length-1)
  }

  if (server.certName){
    lines.push(`    ssl_certificate   ${confDir}/certs/${server.certName}.pem;`)
    lines.push(`    ssl_certificate_key  ${confDir}/certs/${server.certName}.key;`)
    delete server.ssl_certificate
    delete server.ssl_certificate_key
  }


  Object.keys(server).forEach(k=>{
    if (serverBlacklist[k]){
      return
    }
    if (k.startsWith('tmp') || k.startsWith('temp')){
      return;
    }
    let value = (server as any)[k];
    if (isNull(value)){
      return;
    }
    if (isNgxModuleValue(value)){
      const ngxData = value as NgxModuleData
      ngxData.lines?.forEach((item: string)=>{
        lines.push(`    ${item}`)
      })
      ngxData.http?.forEach(line=>httpLines.push(line))
      return;
    }
    if (isBoolean(value)){
      value = value ? 'on': 'off'
    }
    if (isBasicData(value)){
      lines.push(`    ${k}      ${value};`)
      return;
    }
    if (Array.isArray(value) && value.length){
      if (isNgxModuleValue(value[0])){
        value.forEach((data: NgxModuleData)=>{
          data.http?.forEach(line=>httpLines.push(line))
          data.lines?.forEach(line=>lines.push(`    ${line}`))
        })
      }else {
        value = value.join(' ')
        lines.push(`    ${k}      ${value};`)
      }
    }else {
      console.warn('data format not valid', k, value)
    }
  })

  if (server.rewrite && server.rewrite.replacement && server.rewrite.regex){
    lines.push(`    rewrite ${server.rewrite.regex} ${server.rewrite.replacement} ${server.rewrite.flag || ''};`)
  }

  if (server.tmp_custom_config){
      server.tmp_custom_config.split('\n').filter(line=>!!line)
          .forEach(line=>lines.push(`    ${line}`))
  }

  (server.locations || []).forEach(l=>{
    if (isFalse(l.enable)){
      return
    }
    l.lines?.forEach(line=>{
      lines.push(`    ${line}`)
    })
    l.http?.forEach(line=>{
      httpLines.push(line)
    })
  })

  lines.push("}")
  lines.push(`### ${server.server_name} ${server.listen} end...`)
  lines.push('')

  console.log('ngx module',httpLines, server)

  return httpLines.join('\n') + '\n' + lines.join('\n')
}
