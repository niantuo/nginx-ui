import {cloneDeep, isBoolean} from "lodash";
import {INginx, KeyValue} from "../../../../models/nginx.ts";
import {isFalse, isNull} from "planning-tools";

/**
 * 渲染代理配置
 * @param data
 * @param nginx
 */
export const renderProxy = (data: any, nginx: INginx)=>{
  const lines: string[] = []
  const values = cloneDeep(data);
  if (values.proxy_custom_config){
    lines.push(values.proxy_custom_config)
  }
  delete values.proxy_custom_config

  if (Array.isArray(values.proxy_set_header)){
    values.proxy_set_header.forEach((item: KeyValue)=>{
      if (isNull(item.value) || isNull(item.name)){
        return
      }
      lines.push(`proxy_set_header    ${item.name}  ${item.value};`)
    })
  }
  delete values.proxy_set_header

  if (values.ssl_certificate){
    values.proxy_ssl_certificate = `${nginx.dataDir}/certs/${values.ssl_certificate}.pem`
    values.proxy_ssl_certificate_key = `${nginx.dataDir}/certs/${values.ssl_certificate}.key`
    delete values.ssl_certificate
  }

  if (values.tmp_trans_ip){
    lines.push(`proxy_set_header X-Real-IP $remote_addr;`)
    lines.push(`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`)
  }
  delete values.tmp_trans_ip
  if (values.tmp_trans_host){
    lines.push(`proxy_set_header Host $host;`)
  }
  delete values.tmp_trans_host
  if (values.tmp_support_ws){
    lines.push(`proxy_set_header Upgrade $http_upgrade;`)
    lines.push(`proxy_set_header Connection "upgrade";`)
  }
  delete values.tmp_support_ws

  delete values.tmp_proxy_more

  if (isFalse(values.proxy_pass_request_body)){
    lines.push(`proxy_pass_request_body   off;`)
    lines.push(`proxy_set_header  Content-Length    "";`)
  }
  delete values.proxy_pass_request_body

  Object.keys(values).forEach(k=>{
    let v = values[k];
    if (isNull(v)){
      return
    }
    if (isBoolean(v)){
      v = v ? 'on':'off'
    }else if (Array.isArray(v)){
      v = v.join(' ')
    }
    lines.push(`${k}  ${v};`)
  })
  return lines
}
