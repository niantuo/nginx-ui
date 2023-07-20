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
