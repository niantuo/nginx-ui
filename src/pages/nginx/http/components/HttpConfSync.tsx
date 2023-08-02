/**
 * @author tuonian
 * @date 2023/7/6
 */
import {INginx} from "../../../../models/nginx.ts";
import {Button, Drawer, Form, Input, Space, Switch, Tooltip} from "antd";
import {ChangeEvent, useEffect, useState} from "react";
import './index.less'
import {SyncOutlined} from "@ant-design/icons";
import {NginxApis} from "../../../../api/nginx.ts";
import {useAppDispatch} from "../../../../store";
import {NginxActions} from "../../../../store/slice/nginx.ts";
import {Message} from "planning-tools";
import {toNginxConf} from "../utils.ts";

type IProps = {
    nginx?: INginx
    getRealData: () => Promise<any>
}
export const HttpConfSync = ({nginx, getRealData}: IProps) => {

    const [value, setValue] = useState<string>()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [realtime, setRealtime] = useState(false)

    const dispatch = useAppDispatch()

    const onSetRealtime = async (checked: boolean)=>{
        if (!checked){
            setValue(nginx?.httpConf);
            setRealtime(false)
            return
        }
        if (!nginx){
            return
        }
        getRealData().then(data=>{
            const conf = toNginxConf(nginx,data)
            setValue(conf);
            setRealtime(true)
        }).catch(()=>{
            Message.warning('渲染失败，请检查配置文件是否存在错误提示！')
        })
    }


    useEffect(() => {
        setValue(nginx?.httpConf)
    }, [nginx])

    const onChange = (evt: ChangeEvent<HTMLTextAreaElement>) => {
        setValue(evt.currentTarget.value)
    }

    const onSubmitData = () => {
        if (!nginx?.id) {
            return
        }
        setLoading(true);
        NginxApis.refreshHttp({id: nginx.id, httpConf: value || '', httpData: nginx.httpData})
            .then(() => {
                dispatch(NginxActions.updateNginx({...nginx, httpConf: value}))
                Message.success("success")
            })
            .finally(() => {
                setLoading(false)
            })
    }

    if (!nginx?.id) {
        return null
    }

    return (<>
        <Button onClick={() => setOpen(true)}>配置文件</Button>
        <Drawer title="nginx.conf"
                open={open}
                destroyOnClose
                onClose={() => setOpen(false)}
                width={750}
                className="nginx-conf-drawer"
                extra={<>
                <Space>
                    <Form.Item tooltip="渲染实时数据" style={{marginBottom: 0}} label="实时">
                        <Switch onChange={checked=>onSetRealtime(checked)}  checked={realtime}/>
                    </Form.Item>
                    <Tooltip placement="leftBottom"
                             title={`上传配置文件，注意：直接修改配置文件，将在界面操作“同步”功能后丢失`}>
                        <Button danger loading={loading} onClick={onSubmitData} icon={<SyncOutlined />}></Button>
                    </Tooltip>
                </Space>
                </>}
        >
            <Input.TextArea onChange={onChange} value={value}/>
        </Drawer>
    </>)


}
