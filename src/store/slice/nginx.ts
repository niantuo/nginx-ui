import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {INginx, INginxFormConfig, INginxServer, PLocation, PNginxServer} from "../../models/nginx.ts";
import {IServerHost} from "../../models/api.ts";
import {createServer} from "../../pages/nginx/utils/nginx.ts";

export type INginxState = {
  current?: INginx
  server?: INginxServer,
  location?: PLocation,
  currentId?: number
  formConfig?: INginxFormConfig

  upstream?: INginxServer
  streamUpstream?: INginxServer
  servers: INginxServer[]
};

export type SetCurrentData = {
  nginx: INginx,
  servers: IServerHost[],
}

const initialState: INginxState = {
  servers: []
};

const nginxSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrent(state, action: PayloadAction<SetCurrentData>) {
      const payload = action.payload;

      const servers: INginxServer[] = [];
       (payload.servers || []).forEach(item=>{
        const server = createServer(item)
         if (server.isUpstream && server.isStream){
           state.streamUpstream = server;
         }else if (server.isUpstream){
           state.upstream = server;
         }else {
           servers.push(server)
         }
      })

      state.servers = servers;
      state.current = action.payload.nginx;
      state.currentId = action.payload.nginx.id;
      state.server = undefined;
    },
    updateNginx(state, action: PayloadAction<Partial<INginx>>){
      if (state.current){
        state.current = {...state.current, ...action.payload}
      }else {
        state.current = action.payload as any;
      }
    },
    updateUpstream(state,action: PayloadAction<Partial<INginxServer>>){
      if (action.payload.isStream){
        state.streamUpstream = {...state.streamUpstream, ...action.payload} as INginxServer
      }else {
        state.upstream = {...state.upstream,...action.payload} as INginxServer
      }
    },

    updateServers(state,action: PayloadAction<INginxServer[]>){
      state.servers = action.payload;
    },
    addServer(state, action: PayloadAction<INginxServer>){
      state.servers = (state.servers ||[]).concat([action.payload])
    },
    updateServer(state, action:PayloadAction<Partial<INginxServer>>){
      const updateServer = action.payload
      if (state.server && updateServer.id === state.server.id){
        state.server = {...state.server, ...updateServer } as any;
      }
      state.servers = state.servers.map(s=>{
        if (s.id === updateServer.id){
          return { ...s, ...updateServer}
        }
        return s
      }) as any
    },
    setServer(state, action: PayloadAction<PNginxServer| undefined>){
      state.server = action.payload as any
    },
    setLocation(state, action: PayloadAction<PLocation>){
      state.location = action.payload
    }
  },
});

export default nginxSlice.reducer;
export const NginxActions = nginxSlice.actions;
