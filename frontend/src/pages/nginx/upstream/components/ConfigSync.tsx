/**
 * @author tuonian
 * @date 2023/7/13
 */
import {Alert, Button, Input, Modal} from "antd";
import {ChangeEvent, forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {INginx, INginxServer} from "../../../../models/nginx.ts";
import {createServerHost} from "../../utils/nginx.ts";
import {useAppDispatch, useAppSelector} from "../../../../store";
import {NginxApis} from "../../../../api/nginx.ts";
import {Message} from "planning-tools";
import {cloneDeep} from "lodash";
import {NginxActions} from "../../../../store/slice/nginx.ts";


type EditorProps = {
  server: INginxServer
  nginx: INginx
}
type EditorInstance = {
  getData(): string
}
const Editor = forwardRef<EditorInstance,EditorProps>(({server, nginx},ref) => {
  const [content,setContent] = useState('')

  const onChange = (evt: ChangeEvent<HTMLTextAreaElement>)=>{
    setContent(evt.currentTarget.value)
  }

  useImperativeHandle(ref,()=>{
    return {
      getData(): string {
        return  content
      }
    }
  })

  useEffect(()=>{
    const serverHost = createServerHost(nginx, server)
    const data = serverHost.serverConf || '';
    setContent(data)
  },[server, nginx])

  if (!open || !nginx?.id || !server?.id){
    return null
  }

  const lines = content.split('\n').length;
  return (<Input.TextArea value={content}
                          onChange={onChange}
                          rows={Math.max(Math.min(20,lines),5)}
  />)
})

type IProps = {
  server?: INginxServer
}

export const ConfigSync = ({server}: IProps)=>{

  const [open,setOpen] = useState(false)
  const nginx = useAppSelector(state => state.nginx.current)
  const editorRef = useRef<EditorInstance>()
  const [loading,setLoading] = useState(false)
  const dispatch = useAppDispatch()

  const onSubmitData = ()=>{
    if (!editorRef?.current || !nginx?.id || !server?.id){
      return
    }
    const data = editorRef.current.getData();
    const serverHost = createServerHost(nginx,server)
    serverHost.serverConf = data
    setLoading(true);
    NginxApis.refreshServer(serverHost)
      .then(()=>{
        Message.success('更新成功');
        const newServer = cloneDeep(server);
        server.confData = data
        dispatch(NginxActions.updateUpstream(newServer))
      })
      .finally(()=>{
        setLoading(false)
      })

  }

  if (!server?.id || !nginx?.id){
    return null
  }

  return (<>
    <Button onClick={()=>setOpen(true)} ghost type="primary">配置</Button>
    <Modal title="配置文件"
           open={open}
           width={650}
           onOk={onSubmitData}
           onCancel={()=>setOpen(false)}
           destroyOnClose
           confirmLoading={loading}
           >
      <Alert type="warning" closable description="可以直接修改配置文件，将在点击页面“同步”操作后被重置。" style={{marginBottom: 10}}></Alert>
      <Editor ref={editorRef as never} nginx={nginx} server={server} />
    </Modal>
    </>)
}
