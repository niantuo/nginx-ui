/**
 * @author tuonian
 * @date 2023/6/29
 */
import {useAppSelector} from "../../store";
import {useMemo} from "react";
import formConfig from '../../config/nginx_form.json'
import {INginxFormConfig, INginxFormTemplate} from "../../models/nginx.ts";
import formTemplate from '../../config/nginx_template.json'
import {cloneDeep} from "lodash";

// eslint-disable-next-line react-refresh/only-export-components
const EmptyConfig: INginxFormConfig = {
  server: [],
  location: [],
  addNginx: [],
  nginxSettings: [],
  nginxConf: [],
  upstream: [],
  stream: []
}


export const useFormConfig = () => {
  const fixConfig = useAppSelector(state => state.nginx.formConfig);
  return  useMemo(()=>{
    const config = fixConfig || formConfig;
    if (!config){
      return EmptyConfig
    }
    return config as INginxFormConfig
  },[formConfig, fixConfig])
}

/**
 * 数据模板
 */
export const useFormTemplate = ()=>{
  return useMemo(()=>{
    return cloneDeep(formTemplate) as INginxFormTemplate
  },[])
}
