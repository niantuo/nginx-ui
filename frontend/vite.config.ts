import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import {AntdResolve, createStyleImportPlugin} from "vite-plugin-style-import";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import qiankun from 'vite-plugin-qiankun'
import mdx from '@mdx-js/rollup'

import * as path from 'path'



export default defineConfig(({command, mode})=>{
  console.log('command,mode', command,mode)
  const env = loadEnv(mode, process.cwd(),'')
  console.log('env', env.VITE_BASE_API)

  return {
    plugins: [
      mdx({
        format: 'detect',
        include: ["**/*.md",'**/*.mdx']
      }),
      react(),
      createStyleImportPlugin({
        resolves: [AntdResolve()]
      }),
      qiankun('nginx-ui',{
        useDevMode: true
      }),

    ],
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true
        }
      }
    },
    resolve:{
      alias: {
        '@': path.resolve(__dirname,'./src'),
        'docs': path.resolve(__dirname,'./docs')
      }
    },
    assetsInclude: ["**/*.md"],
    server:{
      proxy: {
        ...(mode === 'desktop')? {
          "/api":{
            target: 'http://127.0.0.1:38080',
            rewrite: path => path.replace(/^\/api/,"")
          }
        } : {
          "/api":{
            target: 'http://10.10.0.1:8080',
            // target: 'http://127.0.0.1:8080',
            rewrite: path => path.replace(/^\/api/,"")
          }
        }
      }
    }
  }

})