/**
 * @author tuonian
 * @date 2023/7/10
 */

import Args from './args.mdx'

import './index.less'
import {Tabs} from "antd";

export const HelpPage = ()=>{

  const items =[{
    key: 'args',
    label: '变量',
    children: <Args />
  }]


  return (<div className="help-container">
    <Tabs
      items={items}
      />
  </div>)
}
