import {Routes, Route, HashRouter} from 'react-router-dom';
import {NginxList} from "../pages/nginx/list.tsx";
import {Nginx} from "../pages/nginx";
import {NginxSettings} from "../pages/nginx/settings";
import {NginxHttp} from "../pages/nginx/http";
import {NginxServer} from "../pages/nginx/server";
import {ServerLocation} from "../pages/nginx/location";
import {NewLocation} from "../pages/nginx/location/new.tsx";
import {NewServer} from "../pages/nginx/server/new.tsx";
import {NginxUpstream} from "../pages/nginx/upstream";
import {NginxCerts} from "../pages/nginx/certs";
import {NginxStream} from "../pages/nginx/stream";
import {HelpPage} from "../pages/nginx/help";
import {LoginApis} from "../api/user.ts";
import {useEffect, useState} from "react";
import {useAppDispatch, useAppSelector} from "../store";
import {Spin} from "antd";
import * as React from "react";
import './index.less'
import {useLocation, useNavigate} from "react-router";
import {LoginPage} from "../pages/login";
import {SignupPage} from "../pages/signup";
import {UserActions} from "../store/slice/user.ts";
import dayjs from "dayjs";
import {SSOWrapper} from "../pages/login/sso.tsx";

/**
 * @author tuonian
 * @date 2023/6/26
 */

const nginxRoutes = [
    {
        path: '/nginx/:id',
        component: Nginx,
        children: [
            {
                index: true,
                path: '',
                component: NginxSettings
            },
            {
                path: 'http',
                component: NginxHttp
            },
            {
                path: 'certs',
                component: NginxCerts
            },
            {
                path: 'upstream',
                component: NginxUpstream
            },
            {
                path: 'stream',
                component: NginxStream
            },
            {
                path: 'server/:sid',
                component: NginxServer
            },
            {
                path: 'server/:sid/conf',
                component: NginxServer
            },
            {
                path: 'server/:sid/location/:locId',
                component: ServerLocation
            },
            {
                path: 'server/:sid/location-new',
                component: NewLocation
            },
            {
                path: 'server-new',
                component: NewServer
            },
            {
                path: 'help',
                component: HelpPage
            }
        ]
    },
    {
        path: '/nginx/help',
        component: HelpPage
    }
]

type RouteWrapperProps = {
    Component: React.ComponentType
    [key: string]: any
}
export const RouteWrapper = ({Component, ...props}: RouteWrapperProps) => {

    const [loading, setLoading] = useState(false)
    const user = useAppSelector(state => state.user.user)
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useAppDispatch()

    const fetchUser = () => {
        setLoading(true);
        LoginApis.userinfo().then(({data}) => {
          dispatch(UserActions.setUser(data.data))
            console.log('fetchUser', data)
        }).catch(e => {
            console.warn('userinfo fail', e);
            navigate('/login?to=' + location.pathname)
        })
            .finally(() => {
                setLoading(false)
            })
    }

    useEffect(() => {
        if (!user?.account){
            fetchUser()
            return
        }
        const unix = dayjs().unix()
        const cacheUnix = user.timestamp || 0;
        if (unix - cacheUnix < 3600) {
            setLoading(false)
        } else {
            fetchUser()
        }
    }, [user])

    if (!user || loading) {
        return (<div className="empty-loading">
            <Spin></Spin>
            <div className="hint-msg">加载中,请稍等...</div>
        </div>)
    }

    return <Component {...props} />
}

export const MyRouter = () => {
    return (
       <SSOWrapper>
           <HashRouter basename={'/'}>
               <Routes>
                   <Route path='/' element={<RouteWrapper Component={NginxList}/>}/>
                   {
                       nginxRoutes.map((r) => {
                           return (
                               <Route key={r.path} path={r.path} element={<RouteWrapper Component={r.component}/>}>
                                   {r.children?.map((c, cidx) => {
                                       return (<Route key={r.path + cidx} index={c.index} path={c.path}
                                                      element={<RouteWrapper Component={c.component}/>}/>)
                                   })}
                               </Route>
                           )
                       })
                   }
                   <Route path="/login" Component={LoginPage} />
                   <Route path="/signup" Component={SignupPage} />
               </Routes>
           </HashRouter>
       </SSOWrapper>
    )
}

