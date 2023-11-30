import {AxiosInstance, AxiosRequestConfig} from 'axios'
import {isDesktop} from "../config/consts.ts";
import * as DesktopApi from "../../wailsjs/go/desktop/Api";

// @ts-ignore
export const checkDesktopApi = (request: AxiosInstance)=>{
    if (!isDesktop){
        return
    }
    // @ts-ignore
    request.get = (url: string, config: AxiosRequestConfig<any>)=> {
        const data = config?.params ? JSON.stringify(config.params) : "{}"
        return DesktopApi.GetApi(url, data)
    }
    // @ts-ignore
    request.post = (url: string, data?: any, config?: AxiosRequestConfig<any>) =>{
        return DesktopApi.PostApi(url, data? JSON.stringify(data): "{}")
    }
    // @ts-ignore
    request.delete = (url: string, config?: AxiosRequestConfig<any>) => {
        return DesktopApi.DeleteApi(url, config?.data?JSON.stringify(config.data):"{}")
    }
    // @ts-ignore
    request.put = (url: string, data?: any, config?: AxiosRequestConfig<any>) => {
        return DesktopApi.PutApi(url, data ? JSON.stringify(data): "{}")
    }
}