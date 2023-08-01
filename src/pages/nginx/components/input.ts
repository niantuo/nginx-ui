import {isObject} from "planning-tools";

/**
 * 自定义的模块化输入框的数据格式
 */
export type NgxModuleData<D=any> = {
  data: D
  lines?: string[]
  /**
   * 渲染到http模块，也就是跟server同级别，没想好怎么搞
   */
  http?: string[]
  /**
   * 指定为false，则跳过渲染
   */
  enable?: boolean
}

/**
 * 是否是自定义的nginx的输入框
 * @param value
 */
export const isNgxModuleValue = (value: any)=>{
  if (!isObject(value)){
    return false
  }
  return !!Array.isArray((value as NgxModuleData)?.lines);
}

/**
 * 键值对
 */
export type KeyValue = {
    name: string
    value: string
}

/**
 * 值是那种 ，{name: xxx, value: 123}的形式
 * @param value
 */
export const isNameValue = (value: any)=>{
    return value && value.name && value.value
}

export type ProcessorData = {
    key: string,
    value: any,
    lines:string[],
    httpLines:string[]
}

/**
 * 返回true，表示已经处理完了，不继续后续的处理
 */
export type IRenderProcessor = (data: ProcessorData) => boolean
