import request from "./request.ts";

export type LoginReq = {
    account: string
    password: string
}

export type RegisterReq = LoginReq & {
    nickname?: string
}

export type SSOReq = {
    code: string
    scope: string
    state: string
}

/**
 * 登录相关的API
 */
export const LoginApis = {

    login: (data: LoginReq) => request.post('/user/login', data),
    signUp: (data: RegisterReq) => request.post('/user/register', data),
    userinfo: () => request.get('/user/info', { disableErrorMsg: true } as never),
    oauth2Url: ()=> request.get('/oauth2'),
    oauth2Callback: (data: SSOReq) => request.post('/oauth2/callback', data, { disableErrorMsg: true } as never)

}