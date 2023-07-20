import {IServerHost} from "../../../models/api.ts";
import {INginx, INginxServer} from "../../../models/nginx.ts";
import {renderServer} from "./index.ts";

export const createServer = (host: IServerHost)=>{
  const server = JSON.parse(host.serverData) as INginxServer;
  server.id = host.id;
  server.nginxId = host.nginxId
  server.confData = host.serverConf;
  return server;
}

export const createServerHost = (nginx: INginx, server: Partial<INginxServer>)=>{
  const serverConf = renderServer(nginx,server);
  return  {
    name: `${server.server_name}_${server.listen}`,
    id: server.id,
    nginxId: nginx.id,
    enable: server.enable,
    serverConf: serverConf,
    serverData: JSON.stringify(server),
    remark: server.remark || '',
    isStream: server.isStream,
  }
}