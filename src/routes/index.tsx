import { Routes,Route, HashRouter} from 'react-router-dom';
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
        path:  'certs',
        component: NginxCerts
      },
      {
        path: 'upstream',
        component: NginxUpstream
      },
      {
        path:  'stream',
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

export const MyRouter = ()=>{

 return (
   <HashRouter basename={'/'}>
     <Routes >
       <Route path='/' Component={NginxList}/>
       {
         nginxRoutes.map((r)=>{
           return (
             <Route key={r.path} path={r.path} Component={r.component}>
               {r.children?.map((c, cidx)=>{
                 return (<Route key={r.path + cidx} index={c.index} path={c.path} Component={c.component} /> )
               })}
             </Route>
           )
         })
       }
     </Routes>
   </HashRouter>
 )
}

