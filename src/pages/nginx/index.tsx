/**
 * @author tuonian
 * @date 2023/6/26
 */
import {useLocation, useParams, useNavigate, Outlet} from "react-router";
import {useEffect, useMemo, useState} from "react";
import {useAppDispatch, useAppSelector} from "../../store";

import './index.less'
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import {createNginxMenus, serverRoute} from "../../routes/routes";
import {NginxRouteParams} from "./types.ts";
import {NginxActions} from "../../store/slice/nginx.ts";
import {NavLink} from "react-router-dom";
import {BackButton} from "../../components/BackButton.tsx";
import {StopStartButton} from "./components/StopStartButton.tsx";
import './components'
import {useNginx} from "./utils/nginx.ts";

/**
 * nginx配置首页
 * @param children
 * @constructor
 */
export const Nginx = ({children}: any)=>{

  const location = useLocation();
  const params = useParams<NginxRouteParams>()
  const navigate = useNavigate()
  const [current] = useNginx(params.id);
  const server = useAppSelector(state => state.nginx.server);
  const servers = useAppSelector(state => state.nginx.servers)

  const [activeKey,setActiveKey] = useState<string>('settings')
  const [openKeys,setOpenKeys] = useState<string[]>([])

  const dispatch = useAppDispatch();

  console.log('children',children,params)

  useEffect(()=>{
    setActiveKey(location.pathname)
    console.log('location changed ', location)
  },[location.pathname])

  useEffect(()=>{
    if (!current || !params.sid){
      return
    }
    const routeKey = serverRoute(current.id, params.sid);
    if (openKeys.indexOf(routeKey) == -1){
      setOpenKeys(openKeys.concat([routeKey]))
    }
    if (params.sid && params.sid !== String(server?.id)){
      const now = servers.find(item=>String(item.id) === params.sid);
      if (!now){
        console.log('nginx server invalidate sid', server, params)
        dispatch(NginxActions.setServer())
      }else {
        dispatch(NginxActions.setServer(now))
      }
    }else if (!params.sid){
      dispatch(NginxActions.setServer())
    }
    console.log('params change', params, location, routeKey)
  },[params, servers, current])

  const onClick: MenuProps['onClick'] = (e) => {
    setActiveKey(e.key);
    navigate(e.key, {
      replace: true,
    })

    console.log('click ', e);
  };

  /**
   * 仅允许一个打开
   * @param e
   */
  const onOpenChange: MenuProps['onOpenChange'] = (e)=>{
    console.log('onOpenChange', e)
    setOpenKeys(e)
  }

  const menuItems: MenuProps['items'] = useMemo(()=>{
    if (!current){
      return []
    }
    return createNginxMenus(current, servers);
  },[current, servers])

  return (<div className="nginx-container">
    <div className="nginx-header">
      <BackButton to="/"/>
      <div>Nginx实例配置：{current?.name}</div>
      <div>({current?.ipAddr || '--'})</div>
      <div style={{flex: 1}} />
      <StopStartButton />
      <a target="_blank" style={{fontSize: 14,marginLeft: 10}} href="https://nginx.org/en/docs/">参考文档</a>
    </div>
    <div className="nginx-conf">
      <Menu
        onClick={onClick}
        style={{ width: 300 }}
        mode="inline"
        items={menuItems}
        activeKey={activeKey}
        selectedKeys={[activeKey]}
        onOpenChange={onOpenChange}
        openKeys={openKeys}
      />
      <div className="nginx-routes">
        {
          !current ? (<div className="error">该实例不存在或者已被删除，<NavLink to="/">返回首页</NavLink></div> ): null
        }
        <Outlet />
      </div>
    </div>

  </div>)
}
