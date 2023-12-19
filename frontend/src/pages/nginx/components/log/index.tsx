/**
 * @author tuonian
 * log 标签
 * @date 2023/8/2
 */
import {registerInput} from '../basic'
import {
  AutoTypeInputProps,
  FormColumnType,
  noRequired,
  ObjectInput,
  DataValidatorConfig,
  AutoColumn, isNull
} from "planning-tools";
import {Button, Tooltip} from "antd";
import CONFIG from './config.json'
import './index.less'
import {NgxModuleData} from "../input.ts";
import {useEffect, useMemo, useRef, useState} from "react";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {useAppSelector} from "../../../../store";
import {HttpConfData} from "../../types.ts";
import {cloneDeep} from "lodash";

type AccessLogData = {
    path: string
    level: string
}

type ErrorLogProps = AutoTypeInputProps & {
    columns?: FormColumnType
}
export const ErrorLog = ({value, column, onChange, columns}: ErrorLogProps) => {

    const [data,setData] = useState<AccessLogData>()
    const isInit = useRef(false)

    useEffect(()=>{
        const initialData = value as NgxModuleData;
        isInit.current = true;
        if (initialData?.data){
            setData(initialData.data)
        }else if (!noRequired(column.required)){
            onDataChange(column.value || {})
        }else {
            setData(undefined)
        }
    },[value, column])

    const logColumn = useMemo(()=>{
        if (columns){
            return columns
        }
        const col: FormColumnType = cloneDeep(CONFIG.error_log);
        if (!isNull(column.required)){
          col.required = column.required;
        }
        return col
    },[columns, column])

    const onDataChange = (item?: AccessLogData)=>{
        if (!item){
            onChange?.(item)
        }else {
            const ngxData: NgxModuleData = {
                data: item,
                lines: []
            }
            if (item?.path){
              ngxData.lines?.push(`${logColumn.key}   ${item.path} ${item.level};`)
            }
            onChange?.(ngxData)
        }
    }

    return (<div className="log-input">
        <ObjectInput column={logColumn}
                     onChange={isInit.current ? onDataChange: undefined}
                     value={data} />
        <Tooltip title={logColumn.description}>
            <Button type="link" icon={<QuestionCircleOutlined />}></Button>
        </Tooltip>
    </div>)
}

/**
 * 如果是stream，添加配置项 stream=true
 * @param props
 * @constructor
 */
export const AccessLog = (props: AutoTypeInputProps) => {

    const nginx = useAppSelector(state => state.nginx.current);

    const column = useMemo(()=>{
      const isStream = (props.column as any).stream;
        let result: string[] = [];
        if (nginx?.httpData){
          try {
            const httpData = JSON.parse(nginx?.httpData) as HttpConfData ?? {};
            const list = isStream ? httpData["stream.log_format"] : httpData["http.log_format"] || []
            result= list.filter(item=>item.name && item.content)
                .map(item=>item.name);
          }catch (e) {
            console.log('AccessLog parse httpData fail',e)
          }
        }
        if (result.length == 0){
          result.push(isStream ? 'tcp_format' : 'main')
        }

      const col: FormColumnType = cloneDeep(CONFIG.access_log);
        if (!isNull(props.column.required)){
          col.required = props.column.required;
        }
      const level = col.items?.find(item=>item.key === 'level');
      level && (level.option = result)
      // console.log('accessLog=>',col, props.column.required)
      return col
    },[nginx, props.column])

    return (<ErrorLog {...props} columns={column} />)
}


registerInput('access_log', AccessLog)
registerInput('error_log',ErrorLog)

const validateLog = (value: any, config: AutoColumn) => {
    if (noRequired(config.required) && !value?.data){
        return
    }
    if (!value || !value.data){
        throw new Error('请配置日志')
    }
    const data = value.data as AccessLogData;
    if (!data.path){
        throw new Error("请配置日志路径")
    }
    if (!data.level ){
        throw new Error('请选择日志级别')
    }
}

const validateAccessLog = (value: any, config: AutoColumn) => {
    if (noRequired(config.required) && !value?.data){
        return
    }
    if (!value || !value.data){
        throw new Error('请配置日志')
    }
    const data = value.data as AccessLogData;
    if (!data.path){
        throw new Error("请配置日志路径")
    }
    if (!data.level ){
        throw new Error('请选择日志格式')
    }
}

DataValidatorConfig['error_log'] = validateLog;
DataValidatorConfig['access_log'] = validateAccessLog;
