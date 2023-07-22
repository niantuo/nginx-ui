import React, {useCallback, useEffect, useRef, useState} from "react";

import './dragger.less'
import {uniqueKey} from "planning-tools";
import {Button, Tree} from "antd";
import {
    InboxOutlined,
    FileOutlined,
    FolderOutlined,
    DownOutlined,
    DeleteOutlined, LoadingOutlined, UploadOutlined
} from "@ant-design/icons";
import type { DataNode } from 'antd/es/tree';
import {uploadApis} from "../../../../../api/nginx.ts";
import classNames from "classnames";

/**
 * 文件上传
 */
type MyFile = {

    children?: MyFile[]
    /**
     * 是否为文件夹
     */
    isDirectory?: boolean
    title: string
    key: string
    item: FileSystemEntry
    pKey?: string

} & DataNode

type FileStatus = {
    success?: boolean
    error?: boolean
    loading?: boolean
    message?: string
    key: string
}

type StatusMap = {
    [key:string]: FileStatus
}

type TreeNodeProps = {
    data: MyFile,
    onDelete: (data: MyFile)=>void,
    onUpload: (data: MyFile) =>void
    statusMap: StatusMap
}


const TreeNode = ({data, onDelete, onUpload, statusMap}: TreeNodeProps)=>{
    const [status,setStatus] = useState<FileStatus>({key: data.key})

    useEffect(()=>{
        const cur = statusMap[data.key];
        cur && (setStatus(cur))
    },[statusMap])

    return (
        <div className={classNames('node-data',{ 'error': status.error}, { success: status.success})}>
            <span className="tree-node-title-item">{data.title}</span>
            <div style={{flex: 1}} />
            <LoadingOutlined hidden={!status.loading} />
            <Button onClick={()=>onUpload(data)}
                    size="small"
                    type="link"
                    hidden={status.success || data.isDirectory}
                    icon={<UploadOutlined />}
                    />
            <Button onClick={()=>onDelete(data)}
                    className="delete-btn"
                    size="small" type="text"
                    danger icon={<DeleteOutlined />} />
        </div>
    )
}
type IProps  = {
    onComplete?: (key: string, ok?: boolean)=>void
}
export const Dragger:React.FC<IProps> = ({onComplete}: IProps) => {

    const [ fileList,setFileList] = useState<MyFile[]>([])
    const [loading,setLoading] = useState(false)
    const [batchId,setBatchId] = useState<string>(uniqueKey(15))
    const [statusMap,setStatusMap] = useState<StatusMap>({})
    const filesRef = useRef<MyFile[]>([])

    const dropRef = useRef<HTMLDivElement>()
    const inputRef = useRef<HTMLInputElement>()
    const fileMapRef = useRef<{[key:string]: MyFile}>({})


    const onReset = ()=>{
        setFileList([])
        setBatchId(uniqueKey(15))
        setStatusMap({})
        fileMapRef.current = {}
    }

    useEffect(()=>{
        if (!filesRef.current?.length){
            return
        }
       const okList = filesRef.current.filter(item=>statusMap[item.key]?.success)
        if (okList.length === filesRef.current.length){
            onComplete?.(batchId, true)
        }else {
            onComplete?.(batchId, false)
        }
    },[statusMap])


    const  onUploadFile = (data: MyFile)=>{
        if (data.isDirectory){
            return Promise.resolve()
        }
        const status = {
            key: data.key,
            message: '',
            success: true,
            error: false,
            loading: true
        }
        setStatusMap(map=>({...map,[data.key]: status}))
        return uploadApis.uploadFile(data.item as FileSystemFileEntry , batchId)
            .then(({data: resp})=>{
                const status = {
                    key: data.key,
                    message: '',
                    success: true,
                    error: false,
                    loading: false
                }
                setStatusMap(map=>({...map,[data.key]: status}))
                return resp
            })
            .catch(e=>{
                const status = {
                    key: data.key,
                    message: e.message || '上传失败',
                    success: false,
                    error: true,
                    loading: false
                }
                setStatusMap(map=>({...map,[data.key]: status}))
            })
    }
    const onUpload = async ()=>{
        setLoading(true)
        const allList = Object.values(fileMapRef.current)
            .filter(item=>!item.isDirectory)
            .map(item=> ({...item}))
        filesRef.current = [...allList]
        const batchUpload = ()=>{
            const tasks: Promise<any>[] = []
            for (let i =0;i<4;i++){
                const data = allList.pop()
                if (!data){
                    break
                }
                tasks.push(new Promise((resolve,reject) => {
                    onUploadFile(data)
                        .then(resp=>resolve(resp))
                        .catch(e=>reject(e))
                }))
            }
             Promise.all(tasks)
                .then((data)=>{
                    console.log('batch result', data)
                })
                 .catch(e=>{
                     console.log('batch result fail', e)
                 })
                 .finally(()=>{
                     if (allList.length){
                         batchUpload()
                     }else {
                         setLoading(false)
                         onComplete?.(batchId)
                     }
                 })
        }

        batchUpload()
    }

    const onDelete =(file: MyFile) => {
        if (!file.pKey){
            const list = fileList.filter(item=>item.key !== file.key);
            setFileList(list)
            return
        }
        const parent = fileMapRef.current[file.pKey];
        if (!parent || !parent.children){
            return;
        }
        parent.children = parent.children.filter(item=>item.key !== file.key)
        if (!parent.children?.length){
            const list = fileList.filter(item=>item.key !== parent.key);
            setFileList(list);
        }else {
            setFileList([...fileList])
        }
        console.log('file',file, fileMapRef.current)
    }
    const appendFiles = (items: DataTransferItemList)=>{
        const files: MyFile[] = []
        const fileMap: {[key:string]:MyFile} = {}
        const id = uniqueKey(15)
        setBatchId(id)
        let order = 1
        const createKey = ()=>{
            const key = id+'_'+order
            order++
            return key
        }

        const scanFiles = (item: FileSystemEntry, parent?: MyFile)=>{
            let pList = parent ? parent.children : files;
            if (!pList){
                pList = []
            }
            if (parent){
                parent.children = pList
                fileMap[parent.key] = parent
            }
            if (item.isDirectory){
                const myFile: MyFile = {
                    title: item.name,
                    key: createKey(),
                    children: [],
                    isDirectory: true,
                    icon: <FolderOutlined />,
                    item,
                    isLeaf: false,
                    pKey: parent?.key
                }
                pList.push(myFile)
                const reader = (item as FileSystemDirectoryEntry).createReader()
                reader.readEntries(function (entries){
                    entries.forEach(entry=>{
                        scanFiles(entry, myFile)
                    })
                })
            }else{
                const myFile = {
                    title: item.name,
                    key: createKey(),
                    item,
                    icon: <FileOutlined />,
                    isLeaf: true,
                    pKey: parent?.key,
                }
                pList.push(myFile)
                fileMap[myFile.key] = myFile
            }
        }

        for (let i=0;i<items.length;i++){
            const item = items[i].webkitGetAsEntry();
            if (!item){
                continue
            }
            scanFiles(item)
        }
        setFileList(files)
        fileMapRef.current = fileMap
        console.log('files', files)
    }

    const onDragOver = useCallback((evt: DragEvent)=>{
        evt.preventDefault()
    },[])

    const onDropEvent = useCallback((evt: DragEvent)=>{
        evt.preventDefault()
        if (!evt.dataTransfer){
            console.log('onDropEvent dataTransfer is null')
            return
        }
        const items = evt.dataTransfer.items;
        const files = evt.dataTransfer.files;
        appendFiles(items)
        console.log('items', items)
        console.log('files', files)
    },[])

    useEffect(()=>{
        const container = dropRef.current;
        if (!container){
            return
        }
        container.addEventListener("dragover",onDragOver)
        container.addEventListener("drop", onDropEvent)

        return ()=>{
            container.removeEventListener("dragover", onDragOver)
            container.removeEventListener("drop", onDropEvent)
        }

    },[])

    return (<div className="dragger-input">
        <div onClick={()=>inputRef.current?.click()} ref={dropRef as any} className="dragger">
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或者拖拽文件添加上传的问题</p>
            <p className="ant-upload-hint">
               支持单个文件，或者多个文件，将会压缩成tar.xz文件上传到服务端;更新不会备份Nginx服务器上已有的文件，如果初次使用该功能，请注意文件备份，更新的文件在服务端和nginx的服务器均有备份
            </p>
        </div>
        <input hidden ref={inputRef as any} type="file"/>
        <div className="file-tree-title btn-list">
            <span className="list-name">文件列表</span>
            <Button danger type="link" size="small" disabled={loading} hidden={!fileList.length} onClick={onReset}>清空</Button>
            <Button type="link" size="small" loading={loading} hidden={!fileList.length} onClick={onUpload} >上传</Button>
        </div>
        <Tree
            showIcon
            showLine
            blockNode
            switcherIcon={<DownOutlined />}
            autoExpandParent
            defaultExpandAll
            titleRender={(data)=>(<TreeNode onUpload={onUploadFile}
                                            statusMap={statusMap}
                                            data={data}
                                            onDelete={onDelete} />)}
            treeData={fileList} />

    </div>)
}