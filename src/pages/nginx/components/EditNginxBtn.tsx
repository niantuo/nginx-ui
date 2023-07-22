/**
 * @author tuonian
 * @date 2023/6/30
 */
import {INginx} from "../../../models/nginx.ts";
import {NginxActions} from "../../../store/slice/nginx.ts";
import {useState} from "react";
import {EditOutlined} from "@ant-design/icons";
import {Button} from "antd";
import {NginxApis} from "../../../api/nginx.ts";
import {Notify} from "planning-tools";
import {useAppDispatch} from "../../../store";
import {useNavigate} from "react-router";
import {nginxPrefix} from "../../../routes/routes.tsx";

type IProps = {
  nginx: INginx
}
export const EditNginxBtn = ({nginx}: IProps)=>{

  const [loading,setLoading] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const toNginx = ()=>{
    setLoading(true);
    NginxApis.getNginx(nginx.id)
      .then(({data})=>{
        const respData = data.data;
        if (!respData){
          Notify.warn('查询失败，请重试！');
          return
        }
        console.log('getNginx', data)
        dispatch(NginxActions.setCurrent({
            nginx,
            servers: respData.servers
        }))
        navigate(nginxPrefix(nginx.id))
      })
      .catch(e=>{
        Notify.warn(e.msg || e.message)
      })
      .finally(()=>{
        setLoading(false)
      })


  }

  return (
    <Button loading={loading} onClick={()=>toNginx()} type="link" icon={<EditOutlined />} />
  )
}
