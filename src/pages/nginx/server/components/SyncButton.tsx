import {Button, Tooltip} from "antd";
import {useState} from "react";
import {useAppDispatch, useAppSelector} from "../../../../store";
import {NginxApis} from "../../../../api/nginx.ts";
import {Message} from "planning-tools";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {createServerHost} from "../../utils/nginx.ts";
import {NginxActions} from "../../../../store/slice/nginx.ts";
import {INginxServer} from "../../../../models/nginx.ts";

type IProps = {
  onSubmitData: ()=>Promise<false | INginxServer>
  upstream?: boolean
}
/**
 * 将server的配置同步到服务器
 * @constructor
 */
export const SyncButton = ({ onSubmitData, upstream}: IProps) => {

    const [loading,setLoading] = useState(false)
    const nginx = useAppSelector(state => state.nginx.current);

    const dispatch = useAppDispatch()
    /**
     * 将配置文件同步到服务器
     */
    const onSyncServer = async () => {
        if (!nginx?.id){
            return
        }
      const serverData = await onSubmitData();
        if (!serverData){
          return
        }
        setLoading(true);
        const postData = createServerHost(nginx,serverData)
        NginxApis.refreshServer(postData)
            .then(()=>{
                Message.success("sync success!");
                const updateData: Partial<INginxServer>={
                  ...serverData,
                  confData: postData.serverConf,
                }
                if (upstream){
                  dispatch(NginxActions.updateUpstream(updateData))
                }else {
                  dispatch(NginxActions.updateServer(updateData))
                }
            })
            .finally(()=>{
                setLoading(false)
            })
    }

    if (!nginx?.id){
        return null
    }
    return (
        <>
            <Button danger loading={loading} onClick={onSyncServer}>
                同步
                <Tooltip placement="left" title="同步配置文件到服务器,如果该server为禁用状态，将从服务器删除该配置文件">
                    <QuestionCircleOutlined />
                </Tooltip>
            </Button>
        </>

    )
}
