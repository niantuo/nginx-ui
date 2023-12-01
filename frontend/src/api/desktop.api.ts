import {AxiosInstance, AxiosRequestConfig} from 'axios'
import {isDesktop} from "../config/consts.ts";
import * as DesktopApi from "../../wailsjs/go/desktop/Api";
import {store} from "../store";
import {UserActions} from "../store/slice/user.ts";
import {desktop} from "../../wailsjs/go/models.ts";


const checkResp = (resp: desktop.ApiResp) => {
    if (resp.data?.code == 401){
        store.dispatch(UserActions.clearUser())
    }
    return resp
}

// @ts-ignore
export const checkDesktopApi = (request: AxiosInstance)=>{
    if (!isDesktop){
        return
    }
    // @ts-ignore
    request.get = (url: string, config: AxiosRequestConfig<any>)=> {
        const data = config?.params ? JSON.stringify(config.params) : "{}"
        return DesktopApi.GetApi(url, data).then(res=>checkResp(res))
    }
    // @ts-ignore
    request.post = (url: string, data?: any, config?: AxiosRequestConfig<any>) =>{
        return DesktopApi.PostApi(url, data? JSON.stringify(data): "{}").then(res=>checkResp(res))
    }
    // @ts-ignore
    request.delete = (url: string, config?: AxiosRequestConfig<any>) => {
        return DesktopApi.DeleteApi(url, config?.data?JSON.stringify(config.data):"{}").then(res=>checkResp(res))
    }
    // @ts-ignore
    request.put = (url: string, data?: any, config?: AxiosRequestConfig<any>) => {
        return DesktopApi.PutApi(url, data ? JSON.stringify(data): "{}").then(res=>checkResp(res))
    }
}