import {useEffect, useState} from "react";
import {Button, Modal, Tag} from "antd";
import {isNull, Message} from "planning-tools";
import {NginxApis} from "../../../api/nginx.ts";
import {useAppSelector} from "../../../store";

/**
 *
 * @constructor
 */
export const StopStartButton = () => {

    const [isRun,setIsRun] = useState<boolean>()
    const [loading,setLoading] = useState(false)
    const [modal,contextHolder] = Modal.useModal()

    const nginx = useAppSelector(state => state.nginx.current)

    const fetchStatus = () => {
        if (!nginx){
            return
        }
        setLoading(true)
        NginxApis.status(nginx.id)
            .then(({data})=>{
                setIsRun(data.data)
                console.log('status', data)
                if (!data.msg){
                    return
                }
                if (data.data){
                    Message.success(data.msg)
                }else {
                    Message.warning(data.msg)
                }
            })
            .finally(()=>{
                setLoading(false)
            })
    }


    const postStartOrStopApi = ()=>{
        if (!nginx){
            return
        }
        setLoading(true)
        const request = isRun ? NginxApis.stopNginx(nginx.id) : NginxApis.startNginx(nginx.id);
        request.then(({data})=>{
            console.log('data', data);
            setIsRun(data.data);
            if (data.msg){
                Message.warning(data.msg)
            }
        }).finally(()=>{
            setLoading(false)
        })
    }
    const onStartOrStop  = () => {
        if (isNull(isRun)){
            fetchStatus()
            return
        }
        modal.confirm({
            type: 'warning',
            title: `您确定要${isRun ? '停止' : '启动'}nginx服务吗？`,
            okType: 'danger',
            okText: '确定',
            cancelText: '取消',
            onOk: ()=>{
                postStartOrStopApi()
            }
        })
    }

    useEffect(()=>{
        fetchStatus()
    },[])

    if (!nginx){
        return null
    }

    return (<>
      <span>Nginx：</span>
      <Tag color={isNull(isRun) ? 'grey': isRun ? 'green': 'red'}>{isNull(isRun) ? '未知': isRun ? '运行中':'已停止'}</Tag>
        <Button type={ isRun?'default' : 'primary'}
                onClick={onStartOrStop}
                hidden={isNull(isRun)}
                size="small"
                danger={isRun}
                loading={loading}>
            { isRun ? '停止':'启动'}
        </Button>
        {contextHolder}
        </>)
}
