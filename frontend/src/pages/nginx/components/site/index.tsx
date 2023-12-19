import {Button, Drawer, Form, Input, Modal, Switch} from "antd";
import {
    Message
} from "planning-tools";
import { useState} from "react";
import {CloudUploadOutlined} from "@ant-design/icons";


import './index.less'
import {INginxLocation} from "../../../../models/nginx.ts";
import {Dragger} from "./components/Dragger.tsx";
import {IDeployReq, uploadApis} from "../../../../api/nginx.ts";
import {useAppSelector} from "../../../../store";

type IProps = {
    location: INginxLocation
  onChange?: (location: INginxLocation) => void
}

/**
 * 路由，站点，规则编辑
 * @param value
 * @param onChange
 * @param column
 * @constructor
 */
export const SiteInput = ({ location, onChange }: IProps) => {

    const [editData,setEditData] = useState<Partial<IDeployReq>>()

    const [complete,setComplete] = useState(false)
    const [loading,setLoading] = useState(false)
    const [form] = Form.useForm();
    const [modal,modalContextHolder] = Modal.useModal();

    const nginx = useAppSelector(state => state.nginx.current);


    const onAddData = ()=>{
        if (!location || !nginx?.id){
            return
        }
        if (location.proxy_type!=='static'){
            Message.warning('只支持静态站点的部署！')
            return;
        }
        const initialData :Partial<IDeployReq> = {
          ...location.__deploy__ as any,
            nginxId: nginx.id,
          clear: false,
        }
        if (!initialData.dir){
          if (location.alias){
            initialData.dir = location.alias
          }else if (location.root){
            initialData.dir = location.root
          }
        }
        setEditData(initialData)
    }

    const updateLocation = (deployData: IDeployReq) => {
      const cacheData = {
        cmd: deployData.cmd,
        dir: deployData.dir,
      };
      onChange?.({ ...location, __deploy__: cacheData})
    }

    const onRequest = (postData: IDeployReq)=>{
      setLoading(true)

      uploadApis.deploy(postData)
          .then(()=>{
            Message.success('部署成功！');
            updateLocation(postData);
          })
          .finally(()=>{
            setLoading(false)
          })
    }

    const onSubmitData = async ()=>{
      if (!nginx?.id){
          return
      }
      const values = await form.validateFields()
      const postData: IDeployReq = {
        key: "",
        dir:"",
        ...editData,
        ...values,
        nginxId: nginx.id,
      }
        console.log('onSubmitData',postData);
      if (postData.clear){
        modal.confirm({
          title: '警告',
          content: '您确定要全量部署吗？改操作将会删除部署目录下的所有问题，请谨慎选择！',
          cancelText: '取消全量部署',
          okText: '仍然继续',
          onCancel: ()=>{
            postData.clear = false;
            onRequest(postData)
          },
          onOk: ()=>onRequest(postData),
        })
        return;
      }
      await onRequest(postData);
    }

    /**
     * 文件上传完成的回调
     * @param batchId
     * @param finish 是否全部上传完成
     */
    const onUploadComplete =(batchId: string, finish?: boolean)=>{
        setEditData(data=>({...data,key: batchId}))
        setComplete(!!finish)
    }

    return (
        <>
            <Button onClick={()=>onAddData()} className="add-btn" type="link" icon={<CloudUploadOutlined/>}/>
            <Drawer title={"静态资源部署"}
                    placement="right"
                    open={!!editData}
                    onClose={() => setEditData(undefined)}
                    destroyOnClose
                    width={650}
                    className="site-deploy"
            >
                <Form form={form} layout="vertical" initialValues={editData}>
                    <Form.Item name="dir" label="部署目录" rules={[{required: true,message: '请完善部署目录',validateTrigger: 'blur'}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item className="inline-item"
                               labelCol={{span: 4}}
                               wrapperCol={{span: 18}}
                               name="clear" label="全量部署" tooltip={{title: "全量部署会删除已有的文件，请注意"}}>
                        <Switch />
                    </Form.Item>
                    <Form.Item label="部署命令" name="cmd" tooltip="文件更新后执行该命令，谨慎操作">
                        <Input.TextArea rows={1}/>
                    </Form.Item>
                    <Form.Item name="files" label="资源更新">
                        <Dragger onComplete={onUploadComplete}/>
                    </Form.Item>
                    <div className="btn-list">
                        <Button disabled={loading} onClick={()=>setEditData(undefined)}>取消</Button>
                        <Button loading={loading} onClick={onSubmitData} danger disabled={!complete}>部署</Button>
                    </div>
                </Form>
            </Drawer>
          {modalContextHolder}
        </>
    )
}
