/**
 * @author tuonian
 * @date 2023/6/26
 */
import {Button, Modal, Table, TableColumnsType, Tag} from 'antd'
import {useEffect, useRef, useState} from "react";
import NginxDemo from './nginx.json'
import {INginx} from "../../models/nginx.ts";
import {NginxApis} from "../../api/nginx.ts";
import {AutoForm, AutoFormInstance, Message, Notify} from "planning-tools";
import {useFormConfig} from "./config.tsx";
import {DeleteOutlined, EditOutlined, PlusOutlined, SyncOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router";
import {useAppDispatch} from "../../store";
import {NginxActions} from "../../store/slice/nginx.ts";

export const NginxList = ()=>{


  const [loading,setLoading] = useState(false)
  const [nginxList,setNginxList] = useState<INginx[]>([NginxDemo as any])
  const [open,setOpen] = useState(false)
  const formRef = useRef<AutoFormInstance>()

  const [modal,contextHolder] = Modal.useModal()

  const formConfig = useFormConfig();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const fetchData = ()=>{
    setLoading(true)
    NginxApis.findAll()
      .then(({data})=>{
        if (Array.isArray(data.data)){
          setNginxList(data.data)
        }
        console.log('data',data)
      })
      .catch(e=>{
        console.log('fetchData fail',e)
      })
      .finally(()=>{
        setLoading(false)
      })

  }

  const onAddNginx = async () =>{
    const values = await formRef.current?.onSyncSubmit(true);
    console.log('onAdd', values);
    setLoading(true);
    NginxApis.updateOrAdd(values)
      .then(({data})=>{
        console.log('addNginx', data)
        Message.success('添加成功！')
        setOpen(false)
        fetchData()
      })
      .catch(e=>{
        console.log('add fail', e)
        if (e.code == 1){
          fetchData()
          Notify.warn(`实例添加成功，但环境检查失败：${e.msg || e.message}`);
          setOpen(false)
        }else {
          Notify.warn(e.msg || e.message)
        }
      })
      .finally(()=>{
        setLoading(false)
      })
  }

  const onRemoveNginx = (data: INginx) =>{
    modal.confirm({
      title: '警告',
      content: '您确认要删除该实例吗？该操作不可恢复，请谨慎操作；删除实例不会影响服务器现有的文件和状态',
      okType: 'danger',
      okText: '确认删除',
      cancelText: '先不了',
      onOk: ()=>{
        NginxApis.delNginx(data.id)
          .then(()=>{
            fetchData()
          })
          .catch(e=>{
            Notify.warn(e.msg || e.message)
          })
      }
    })
  }

  useEffect(()=>{
    fetchData()
  },[])

  const toNginx = (nginx: INginx) => {
    dispatch(NginxActions.reset())
    navigate(`/nginx/${nginx.id}`)
  }

  const renderOperations = (data: INginx)=>{

    return (<>
      <Button onClick={()=>toNginx(data)} type="link"><EditOutlined /></Button>
      <Button onClick={()=>onRemoveNginx(data)} danger type="text" icon={<DeleteOutlined />}/>
    </>)

  }

  const columns = [
    {
      dataIndex: 'id',
      title: 'ID',
    },
    {
      dataIndex: 'name',
      title:"名称"
    },
    {
      dataIndex: 'isLocal',
      title: '实例类型',
      render: value => value ? '本地实例':<Tag color="orange">远程实例</Tag>
    },
    {
      dataIndex: 'ipAddr',
      title:'实例IP',
      render: (value,record) => record.isLocal ? '--': value
    },
    {
      dataIndex: 'remark',
      title:'备注信息'
    },
    {
      title: '操作',
      render: (_,record)=>renderOperations(record),
      width: 180,
      fixed: 'right'
    }

  ] as TableColumnsType<INginx>

  console.log('list' ,nginxList)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          Nginx实例
        </div>
       <div>
         <Button loading={loading} onClick={()=>fetchData()} icon={<SyncOutlined />} />
         <Button type="primary" loading={loading} onClick={()=>setOpen(true)}  icon={<PlusOutlined />}/>
       </div>

      </div>
      <div className="page-container">
        <Table
          dataSource={nginxList}
          columns={columns as any}
          rowKey="id"
        >
        </Table>
      </div>
      <Modal title="新增实例"
      open={open}
             destroyOnClose={true}
             maskClosable={false}
             onCancel={()=>setOpen(false)}
             onOk={onAddNginx}
             confirmLoading={loading}
             width="800px"
      >
        <AutoForm data={{isLocal: true}}
                  columns={formConfig.addNginx}
                  ref={formRef as never} />
      </Modal>
      {contextHolder}
    </div>
  )
}
