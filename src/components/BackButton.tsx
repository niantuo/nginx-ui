/**
 * @author tuonian
 * @date 2023/6/30
 */
import {Button} from "antd";
import {ArrowLeftOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router";


type IProps = {
  to?: string
}
export const BackButton = ({to}: IProps) => {

  const navigate = useNavigate()

  const goBack = ()=>{
    if (to){
      navigate(to, { replace: true })
    }else {
      navigate(-1)
    }
  }

  return (<Button
    ghost style={{color: '#1890ff',marginRight: 10}}
                  onClick={goBack}
                  icon={<ArrowLeftOutlined />} /> )
}
