import {NginxApis} from "../../../api/nginx.ts";
import {useAppSelector} from "../../../store";
import {useEffect, useState} from "react";
import {Button, Drawer, Form, Input, Modal, Table, Tooltip, Upload} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ImportOutlined,
  PlusOutlined, QuestionOutlined,
  SyncOutlined,
  UploadOutlined
} from "@ant-design/icons";

import './index.less'
import {INginxCerts} from "../../../models/api.ts";
import {RcFile} from "antd/es/upload";
import {isNull, Message} from "planning-tools";
import {ModalStaticFunctions} from "antd/es/modal/confirm";

/**
 * 证书管理
 * @constructor
 */
export const NginxCerts = () => {
    const nginx = useAppSelector(state => state.nginx.current)

    const [loading, setLoading] = useState(false)
    const [certs, setCerts] = useState<INginxCerts[]>([])
    const [cert, setCert] = useState<Partial<INginxCerts>>()
    const [modal,contextHolder] = Modal.useModal()


  const [form] = Form.useForm()

    const onBeforeUpload = (name: 'pem' | 'key', file: RcFile) => {
        console.log('onBeforeUpload', name, file.name)
        file.text().then(v=>{
            const data = {...cert, [name]: v };
            setCert(data as INginxCerts)
            form.setFieldsValue(data)
        })

        return false
    }

    const fetchList = () => {
        if (!nginx?.id) {
            return
        }
        setLoading(true)
        NginxApis.getCerts(nginx.id)
            .then(({data}) => {
                const content = data.data;
                if (!content) {
                    setCerts([])
                }else {
                  setCerts(data.data)
                }
            })
            .finally(() => {
                setLoading(false)
            })
    }

    const syncFromDisk = ()=>{
      if (!nginx?.id){
        return
      }
      setLoading(true)
      NginxApis.syncCerts(nginx.id)
        .then(() => {
          fetchList()
        })
        .finally(() => {
          setLoading(false)
        })
    }

    const onAddData = ()=>{
        setCert({})
        form.resetFields()
    }

  const onEditCert = (data: INginxCerts)=>{
    const fields = { ...data }
    setCert(fields)
    form.setFieldsValue(fields)
  }

    const onSubmitData = async ()=>{
        if (!nginx?.id){
          Message.warning('缓存数据异常，请退出到首页重新进去nginx实例配置页面。')
            return
        }
        const values = await form.validateFields()
        console.log('values',values);
        setLoading(true);
        const postData = { ...cert, ...values}
        postData.nginxId = nginx.id
        NginxApis.saveCerts(nginx.id, postData)
            .then(({data})=>{
                console.log('data',data);
                Message.success('保存成功！');
                setCert(undefined)
                fetchList();
            })
            .finally(()=>{
                setLoading(false)
            })
    }


    useEffect(() => {
        fetchList()
    }, [])

    return (<div className="page cert-page">
        <div className="page-header">
            <Button type="primary" loading={loading} onClick={fetchList} icon={<SyncOutlined/>}/>
            <Button onClick={onAddData} icon={<PlusOutlined/>}/>
            <div style={{flex:1}} />
          <Tooltip placement="left" title="从数据目录中导入，适用于初始化;如果数据库中已存在，会覆盖，请谨慎处理">
            <Button danger loading={loading} onClick={syncFromDisk} icon={<ImportOutlined/>}></Button>
          </Tooltip>
        </div>
        <div className="page-container cert-list">
          <Table rowKey="id" dataSource={certs} pagination={false}>
            <Table.Column
              title="名称"
              dataIndex="serviceName"
            />
            <Table.Column
              title="域名"
              dataIndex="subjectName"
              render={(v,data: INginxCerts)=>{
                return (<>
                  {v || '--'}
                  { data.hintMsg ? <Tooltip title={data.hintMsg}><QuestionOutlined /></Tooltip> : null }
                </>)
              }}
            />
            <Table.Column title="添加时间" dataIndex="createdAt" />
            <Table.Column title="过期时间" dataIndex="expiresAt" />
            <Table.Column title="备注" dataIndex="remark" />
            <Table.Column title="操作" dataIndex="ops"
                          width={120}
                          render={(_,data: INginxCerts)=>(<>
                            <DelButton onRefresh={fetchList} cert={data} nginxId={nginx?.id || 0} modal={modal} />
                            <Button onClick={()=>onEditCert(data)} type="link" icon={<EditOutlined />}></Button>
            </>)} />
          </Table>
          <Drawer open={!!cert}
                  width={750}
                  className="cert-edit-drawer"
                  onClose={()=>setCert(undefined)}
                  destroyOnClose
                  title={isNull(cert?.id) ?'添加证书': '编辑证书'}>

            <div className="cert-data">
              <Form form={form} initialValues={cert} labelCol={{span: 4}}>
                <Form.Item name="serviceName"
                           rules={[{required: true, message: '请输入域名或者名称，唯一不可重复'}]}
                           label="域名">
                  <Input />
                </Form.Item>
                <div className="inline-item" >
                  <Form.Item name="pem"
                             rules={[{required: true, message: '请输入或者选择证书'}]}
                             label="pem证书">
                    <Input.TextArea rows={8}/>

                  </Form.Item>
                  <Upload beforeUpload={(file) => onBeforeUpload("pem", file)}
                          showUploadList={false}
                          accept=".pem">
                    <Button icon={<UploadOutlined/>}></Button>
                  </Upload>
                </div>
                <div className="inline-item" >
                  <Form.Item name="key"
                             rules={[{required: true, message: '请输入或者选择私钥'}]}
                             label="私钥">
                    <Input.TextArea rows={8} />

                  </Form.Item>
                  <Upload beforeUpload={(file) => onBeforeUpload("key", file)}
                          showUploadList={false}
                          accept=".key">
                    <Button icon={<UploadOutlined/>}></Button>
                  </Upload>
                </div>

                <Form.Item name="remark" label="备注">
                  <Input.TextArea />
                </Form.Item>
                <Form.Item className="footer-item">
                  <Button onClick={()=>setCert(undefined)}>取消</Button>
                  <Button loading={loading} onClick={onSubmitData} type="primary">保存</Button>
                </Form.Item>
              </Form>
            </div>
          </Drawer>
        </div>
      {contextHolder}

    </div>)
}
type IProps = {
    cert: INginxCerts
    nginxId: number
    onRefresh: () => void
  modal: Omit<ModalStaticFunctions, "warn">
}
const DelButton = ({cert, nginxId, onRefresh, modal}: IProps)=>{

    const [loading,setLoading] = useState(false)

    const onDel = (e: any)=>{
        e.preventDefault()
        modal.confirm({
            title: '警告',
            content: '您确定要删除该证书信息吗？删除操作不可恢复，请谨慎操作.',
            okType: 'danger',
            cancelText: '取消',
            okText: '确定',
            onOk: ()=>{
                setLoading(true)
                NginxApis.delCerts(nginxId, cert.id)
                    .then(()=>{
                        onRefresh?.()
                    })
                    .finally(()=>{
                        setLoading(false)
                    })
            }
        })
    }



    return <>
        <Button onClick={onDel}
                loading={loading}
                type="text"
                danger
                icon={<DeleteOutlined />}
        />
    </>
}
