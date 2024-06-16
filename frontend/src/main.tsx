import React from 'react'
import ReactDOM, {Root} from 'react-dom/client'
import './adapter/index.js'
import App from './App.tsx'
import './index.css'
import './styles/index.less'
import renderWithQiankun from "vite-plugin-qiankun/es/helper";
import './i18n/i18n.ts'

let root: Root | null

const render = (props: any ={}) => {
  console.log('[nginx-ui] render', props);
  const {container} = props;
  const rootContainer = container ? (container as HTMLElement).querySelector('#nginx_ui_root') : document.getElementById('nginx_ui_root')
  root = ReactDOM.createRoot(rootContainer as never);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

const initQianKun = ()=>{
  renderWithQiankun({
    bootstrap(){
      console.log('bootstrap')
    },
    mount(props){
      console.log('[nginx-ui] mount', props)
      render(props)
    },
    unmount(){
      console.log('unmount')
      if (!root){
        return
      }
      try {
        root.unmount()
        root = null
      }catch (e) {
        console.log('[nginx-ui] unmount fail', e)
      }
    },
    update(props){
      console.log('update', props)
    }
  })
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (window.__POWERED_BY_QIANKUN__){
  initQianKun()
} else {
  render()
}
