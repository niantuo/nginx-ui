import axios, {AxiosResponse} from 'axios';
import {BaseResp} from "../models/api.ts";
import {Message, Notify} from "planning-tools";
import {store} from "../store";
import {UserActions} from "../store/slice/user.ts";
console.log('env', import.meta.env)

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const CONFIG = window.CONFIG;
if (!CONFIG.baseApi){
  CONFIG.baseApi = '/api'
}

/**
 * 支持网络请求
 * @type {AxiosInstance}
 */
// create an axios instance
const request = axios.create({
  baseURL: CONFIG.baseApi,
  withCredentials: true, // send cookies when cross-domain requests
  timeout: 10000, // request timeout
});

request.interceptors.request.use(
  (config) => {
    if (!config.headers){
      config.headers = {}
    }
    config.headers["Authorization"] = "token"
    return config;
  },
  (error) => {
    // do something with request error
    console.log(error); // for debug
    return Promise.reject(error);
  },
);

request.interceptors.response.use((resp: AxiosResponse<BaseResp>)=>{
  const disableErrorMsg = (resp.config as any)['disableErrorMsg']
  if (resp.data && resp.data.code == 0){
    return resp
  }else if (resp.data) {
    (!disableErrorMsg) && Notify.warn(resp.data.msg)
    return Promise.reject(resp.data)
  }else {
    (!disableErrorMsg) && Notify.warn("请求错误")
    return resp
  }
},error => {
  let errData: any = {
    code: 10
  }
  const disableErrorMsg = (error.request?.config as any)?.['disableErrorMsg']
  if (error.response && error.response.data){
    errData = error.response.data
  }else if (error.message){
    errData.msg = error.message;
  }
  if (!errData.code){
    errData.msg = 'request fail'
  }
  (!disableErrorMsg)&& Message.error(errData.msg)
  if (error.response.statusCode == 401){
    store.dispatch(UserActions.clearUser())
  }
  return Promise.reject(errData)
})


export default request
