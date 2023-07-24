
import './index.less'
import {Button, Form, Input, Spin, Tabs} from "antd";
import {TabsProps} from "antd/lib/tabs";
import {Link} from "react-router-dom";
import {LoginApis, LoginReq } from "../../api/user.ts";
import { useState} from "react";
import {useAppDispatch} from "../../store";
import {UserActions} from "../../store/slice/user.ts";
import {Message} from "planning-tools";
import {useNavigate } from "react-router";
import {useQuery} from "../../utils";
import {useSSOLogin} from "./sso.ts";

const AccountPanel = ()=>{

    const [loading,setLoading] = useState(false)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const query = useQuery<{to?: string}>()

    const onSubmit = (values: LoginReq)=>{
        console.log('submit',values);
        setLoading(true);
        LoginApis.login(values)
            .then(({data})=>{
                console.log('login resp',data)
                if (data.data){
                    dispatch(UserActions.setUser(data.data));
                    navigate(query?.to || '/')
                }
                if (data.code == 0){
                    Message.success(data.msg)
                }else {
                    Message.warning(data.msg)
                }
            })
            .finally(()=>{
                setLoading(false)
            })
    }

    return (
        <Form onFinish={onSubmit} labelCol={{span: 4}}>
            <Form.Item name="account" label="账号" rules={[{required: true,message: '请输入账号'}]}>
                <Input placeholder="请输入账号" />
            </Form.Item>
            <Form.Item name="password" label="密码"  rules={[{required: true,message: '请输入密码'}]}>
                <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <div className="login-btn">
                <Button loading={loading} htmlType="submit" type="primary">登录</Button>
                <span className="signup">没有账号？<Link to="/signup">去注册</Link></span>
            </div>
        </Form>
    )
}


export const LoginPage = ()=>{

    const [activeKey,setActiveKey] = useState('account')
    const [loading] = useSSOLogin()

    const fetchSSO = ()=>{
        LoginApis.oauth2Url()
            .then(({data})=>{
                if (data.code == 0){
                    window.location.href = data.data.redirect_url
                }else {
                    Message.warning(data.msg)
                }
            })
    }


    const onActiveKeyChange = (ak: string)=>{
        if (ak === 'sso'){
            setActiveKey(ak);
            fetchSSO()
        }else if (!loading){
            setActiveKey(ak);
        }
    }


    const tabItems:TabsProps["items"] = [
        {
            label: '账号密码',
            key: 'account',
            children: <AccountPanel />
        },
        {
            label: "SSO",
            key: 'sso',
            children: <Spin />
        }
    ]

    return (<div className="login-page">
        <div className="login-container">
            <Tabs activeKey={activeKey} onChange={onActiveKeyChange} items={tabItems}></Tabs>
        </div>
    </div>)
}


