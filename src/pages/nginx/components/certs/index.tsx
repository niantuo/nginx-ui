import {AdvanceInputConfigs, AutoTypeInputProps} from "planning-tools";
import {Select} from "antd";
import {useEffect, useState} from "react";
import {NginxApis} from "../../../../api/nginx.ts";
import {useAppSelector} from "../../../../store";
import {INginxCerts} from "../../../../models/api.ts";
/**
 * @author tuonian
 * @date 2023/7/4
 */

export const CertsSelect = ({value, onChange }: AutoTypeInputProps)=>{

  const [loading,setLoading] = useState(false)
  const [options,setOptions] = useState<any[]>([])

  const nginx = useAppSelector(state => state.nginx.current)

  const fetchCerts = ()=>{
    if (!nginx?.id){
      return
    }
    setLoading(true)
    NginxApis.getCerts(nginx.id)
      .then(({data})=>{
        const list = Array.isArray(data.data) ?data.data.map((item: INginxCerts)=>{
          return {
            label: item.serviceName,
            value: item.serviceName
          }
        }): []
        setOptions(list)
      })
      .finally(()=>{
        setLoading(false)
      })

  }
  useEffect(()=>{
    fetchCerts()
  },[])


  return (<Select loading={loading}
                  value={value}
                  onChange={onChange}
                  options={options}
                  style={{marginRight: 10}} />)
}


AdvanceInputConfigs['certs'] = CertsSelect
