import {useQuery} from "../../utils";
import {LoginApis, SSOReq} from "../../api/user.ts";
import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {Message} from "planning-tools";

export const useSSOLogin = ()=>{
  const ssoData = useQuery<SSOReq & {to?: string}>()
  const navigate = useNavigate()
  const [loading,setLoading] = useState(false)

  const onSSOCallback = (data: SSOReq)=>{
    setLoading(true);
    LoginApis.oauth2Callback(data)
      .then(({data})=>{
        if (data.code === 0){
          Message.success(data.msg);
          navigate(ssoData?.to || '/')
        }else {
          Message.warning(data.msg)
        }
      })
      .finally(()=>{
        setLoading(false)
      })
  }


  useEffect(()=>{
    if (ssoData?.code){
      onSSOCallback(ssoData)
    }
    console.log('ssoData', ssoData)
  },[ssoData])

  return [loading]

}
