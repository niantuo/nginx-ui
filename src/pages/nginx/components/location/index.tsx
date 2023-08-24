import {Button, Drawer, Input, Modal, Popover, Space, Switch, Table} from "antd";
import {ColumnsType} from "antd/es/table";
import {
    AdvanceInputConfigs,
    AutoForm,
    AutoFormInstance,
    AutoTypeInputProps,
    isNull,
    Message,
    uniqueKey
} from "planning-tools";
import {useEffect, useRef, useState} from "react";
import {CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {INginxLocation} from "../../../../models/nginx.ts";
import {cloneDeep} from "lodash";
import FormConfig from './config.json'

import './index.less'
import {SiteInput} from "../site";
import {renderLocation} from "./utils.ts";

/**
 * 部分的重要信息
 * @param data
 * @param onChange
 * @constructor
 */
const LocationInfo = ({data, onChange}:{ data: INginxLocation, onChange?: (data: INginxLocation) => void})=>{

    const rootDir = ()=>{
        if (data.alias){
            return `alias: ${data.alias}`
        }
        return `root: ${data.root || '--'}`
    }


    return (<div>
        {
            data.proxy_type === 'proxy' ? <div>{`proxy: ${data.proxy_pass}`}</div> : null
        }
        {
            data.proxy_type === 'static' ? <div>{rootDir()}<SiteInput onChange={onChange} location={data} /></div>:null
        }
        <div>
            {
                data.rewrite?.regex && data.rewrite?.replacement ? `${data.rewrite.regex} ${data.rewrite.replacement}` : ''
            }
        </div>
    </div>)
}

/**
 * 路由，站点，规则编辑
 * @param value
 * @param onChange
 * @param column
 * @constructor
 */
export const LocationInput = ({value, onChange }: AutoTypeInputProps) => {

    const [locations, setLocations] = useState<INginxLocation[]>([])

    const [editData, setEditData] = useState<INginxLocation>()
    const isAddRef = useRef(false)

    const [modal,contextHolder] = Modal.useModal()

    const formRef = useRef<AutoFormInstance>()

    useEffect(() => {
        if (Array.isArray(value)) {
            setLocations(value.map((item: INginxLocation) => {
                if (!item.id) {
                    item.id = uniqueKey(20)
                }
                if (!item.lines){
                    renderLocation(item)
                }
                return item
            }))
        }

    }, [value])

    const onEditRow = (data: INginxLocation) => {
        isAddRef.current = false
        setEditData(cloneDeep(data))
    }

    const onAddData = (data?: INginxLocation, index?: number)=>{
        isAddRef.current = true
        setEditData({ ...data,id: uniqueKey(20),__index__: index} as never)
    }

    const onRemoveData = (data: INginxLocation)=>{
        const onOk = ()=>{
            const list = locations.filter(item=>item.id !== data.id);
            onChange?.(list)
        }
        modal.confirm({
            title: '提示',
            type: 'warning',
            content: '您确定要删除该代理/站点吗？删除操作不可恢复，请谨慎操作!',
            okType: 'danger',
            okText: '仍要删除',
            cancelText: '先不了',
            onOk,
        })
    }

    const onQuickChangeStatus = (data: INginxLocation, enable: boolean) => {
        const list = locations.map(item=>{
            if (item.id === data.id){
                return { ...item, enable }
            }
            return item
        })
        onChange?.(list)
    }

    const onSubmitData = async () => {
        const values = await formRef.current?.onSyncSubmit(true);
        const newData = {...editData, ...values} as INginxLocation;
        console.log('newLocation', newData);
        if (!editData) {
            console.warn('editData is null ,skip ');
            return
        }
        renderLocation(newData)
        let list: INginxLocation[]
        if (isAddRef.current){
            const index = newData.__index__ || locations.length;
            delete newData.__index__;
            let exist = locations.find(item=>item.name == newData.name);
            if (exist){
                Message.warning('名称不能相同，请修改后再保存！');
                return
            }
            exist = locations.find(item=> {
                if (item.match && newData.match){
                    return item.match.regex === newData.match.regex && item.match.path === newData.match.path
                }
                return false
            });
            if (exist){
                Message.warning('匹配规则不能完全一样，请修改后重新添加！');
                return
            }
            renderLocation(newData);
            if (isNull(index) || index < 0 || index >= locations.length-1){
                list = locations.concat([newData])
            }else {
                list = []
                locations.forEach((item,idx)=>{
                    if (idx === index){
                        list.push(item)
                        list.push(newData)
                    }else {
                        list.push(item)
                    }
                })
            }
        }else {
            renderLocation(newData);
            list = locations.map(item => {
                if (item.id === newData.id) {
                    return {...item, ...newData}
                }
                return item
            })
        }
        onChange?.(list)
        setEditData(undefined)
    }

  /**
   * 部署数据变化，不重新渲染
   * @param data
   */
  const onDeployDataChange = (data: INginxLocation) => {
    const newList = locations.map(item=>{
      if (item.id === data.id){
        return { ...item, ...data}
      }
      return item;
    });
    onChange?.(newList)
  }

    const renderPreview = (data: INginxLocation)=>{
        let content ='';
        let rows = 0;
        if (data.http?.length){
           content = data.http.join('\n') + '\n';
           rows = data.http.length;
        }
        if (data.lines){
            content = content+ data.lines.join('\n')
            rows +=data.lines.length
        }
        return (<div className="location-conf-preview">
            <Input.TextArea rows={Math.max(Math.min(10,rows),5)} disabled value={content} />
        </div>)
    }

    const renderOps = (_: never, data: INginxLocation, index: number) => {
        return (
            <div className="location-btns">
                <Button onClick={() => onRemoveData(data)} type="text" danger icon={<DeleteOutlined/>}/>
                <Button onClick={() => onEditRow(data)} type="link" icon={<EditOutlined/>}/>
                <Button onClick={()=>onAddData(data, index)} type="link" icon={<CopyOutlined/>}/>
                <Popover trigger="click" destroyTooltipOnHide
                         placement="top"
                         content={()=>renderPreview(data as never)} >
                    <Button type="link">预览</Button>
                </Popover>
            </div>
        )
    }

    const columns: ColumnsType = [
        {
            dataIndex: 'name',
            title: '路由名称',
            width: 120
        },
        {
            dataIndex: 'match',
            title: "规则",
            render: (value) => <span>{`${value.regex || ''} ${value.path}`}</span>
        },
        {
            dataIndex: 'enable',
            title: '状态',
            render: (value,record) => <Switch onChange={c=>onQuickChangeStatus(record as never,c)} checked={value}/>
        },
        {
            dataIndex: 'proxy_pass',
            title: '代理或路径',
            render: (_,record: any)=>{
                return (<LocationInfo onChange={onDeployDataChange} data={record} />)
            }
        },
        {
          dataIndex: 'remark',
          title:"备注",
        },
        {
            title: '操作',
            render: renderOps as never,
            width: 180,
            fixed: 'right'
        }
    ]

    return (
        <>

            {
                locations.length ? (<Table pagination={false}
                                           style={{marginRight: 5}}
                                           rowKey="id"
                                           columns={columns as never}
                                           className="location-table"
                                           dataSource={locations}>
                    <div>Empty</div>
                </Table>) : (
                    <>
                        <Button onClick={()=>onAddData()} className="add-btn" type="link" icon={<PlusOutlined/>}/>
                    </>
                )
            }
            <Drawer title={isAddRef.current? '新增' : '编辑'}
                    placement="right"
                    open={!!editData}
                    onClose={() => setEditData(undefined)}
                    destroyOnClose
                    width={900}
                    className="location-input"
                    extra={<Space>
                        <Button onClick={onSubmitData} ghost type="primary">保存</Button>
                    </Space>}
            >
                <AutoForm
                    columns={FormConfig.form}
                    ref={formRef as never}
                    data={editData}/>
            </Drawer>
            {contextHolder}
        </>
    )
}


AdvanceInputConfigs['locations'] = LocationInput
