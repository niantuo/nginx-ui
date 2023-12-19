import {LoginApis, SSOReq} from "../../api/user.ts";
import {useEffect, useState} from "react";
import {Message} from "planning-tools";
import {getFirst, getLastTo, parseQuery} from "../../utils";
import {EmptyLoading} from "../../components/empty";

/**
 * 对接SSO登录
 * @param children
 * @constructor
 */
export const SSOWrapper = ({children}: any)=>{
  const [loading,setLoading] = useState(true)

  const onSSOCallback = ()=>{
    const { query, url} = parseQuery<SSOReq & {to?: string}>() ?? {}
    if (!query?.code){
      setLoading(false)
      return
    }
    Object.keys(query).forEach(k=>{
      query[k] = getFirst(query[k])
    })
    setLoading(true);
    LoginApis.oauth2Callback(query)
        .then(({data})=>{
          if (data.code === 0){
            Message.success(data.msg);
          }else {
            Message.warning(data.msg);
          }
        })
        .catch(e=>{
          console.log('oauth2Callback error',e)
          Message.error('登录失败，请重新登录！');
        })
        .finally(()=>{
          const lastTo = getLastTo();
          window.location.href = `${url}#${lastTo}`;
          setLoading(false)
        })
  }

  useEffect(()=>{
    onSSOCallback()
  },[])

  if (loading){
   return (<EmptyLoading />)
  }
  return children
}