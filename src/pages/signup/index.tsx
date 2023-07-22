import './index.less'
import {Button, Form, Input} from "antd";
import {Link} from "react-router-dom";
import {useState} from "react";
import {LoginApis} from "../../api/user.ts";
import {useNavigate} from "react-router";
import {Message} from "planning-tools";

export const SignupPage = ()=>{

    const [loading,setLoading] = useState(false)
    const navigate = useNavigate()

    const onSubmit = (values: any)=>{
        setLoading(true)
        LoginApis.signUp(values)
            .then(({data})=>{
                if (data.code === 0){
                    Message.success(data.msg);
                    navigate('/login')
                }else {
                    Message.warning(data.msg)
                }
            })
            .finally(()=>{
                setLoading(false)
            })
    }

    return (<div className="signup-page">
        <div className="container">
            <h5>注册</h5>
            <Form onFinish={onSubmit} labelCol={{span: 4}}>
                <Form.Item name="account" label="账号" rules={[{required: true,message: '请输入账号'}]}>
                    <Input placeholder="请输入账号" />
                </Form.Item>
                <Form.Item name="password" label="密码"  rules={[{required: true,message: '请输入密码'}]}>
                    <Input.Password placeholder="请输入密码" />
                </Form.Item>
                <Form.Item name="nickname" label="姓名">
                    <Input placeholder="请输入姓名" />
                </Form.Item>
                <div className="login-btn">
                    <Button loading={loading} htmlType="submit" type="primary">提交</Button>
                    <span className="signup">已有账号？<Link to="/login">去登录</Link></span>
                </div>
            </Form>
        </div>
    </div>)
}