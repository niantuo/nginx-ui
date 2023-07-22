import {useAppSelector} from "../../../store";
import {ITabInstance, UpstreamTab} from "./tab.tsx";
import {Button, Tabs} from "antd";
import {SyncButton} from "../server/components/SyncButton.tsx";
import {useRef, useState} from "react";
import {ConfigSync} from "./components/ConfigSync.tsx";

/**
 * 给他伪装成server来操作
 * @constructor
 */
export const NginxUpstream = () => {

  const upstream = useAppSelector(state => state.nginx.upstream)
  const streamUpstream = useAppSelector(state => state.nginx.streamUpstream)
  const [activeKey, setActiveKey] = useState('http')

  const httpRef = useRef<ITabInstance>()
  const tcpRef = useRef<ITabInstance>()


  const items = [
    {
      label: "HTTP",
      key: "http",
      children: <UpstreamTab ref={httpRef as never} server={upstream}/>
    },
    {
      label: "TCP/UDP",
      key: "stream",
      children: <UpstreamTab ref={tcpRef as never} server={streamUpstream} isStream={true}/>
    }
  ]

  const onSyncData = () => {
    if (activeKey === 'http') {
      return httpRef.current?.onSyncData() || Promise.resolve(false)
    }
    return tcpRef.current?.onSyncData() || Promise.resolve(false)
  }

  const onSaveData = () => {
    if (activeKey === 'http') {
      return httpRef.current?.onSaveData()
    }
    return tcpRef.current?.onSaveData()
  }

  return (<div className="page" style={{paddingLeft: 10, paddingRight: 10}}>
    <Tabs
      items={items}
      activeKey={activeKey}
      onChange={k => setActiveKey(k)}
      tabBarExtraContent={
        <>
          <ConfigSync server={activeKey == "http" ? upstream: streamUpstream} />
          <SyncButton upstream={true} onSubmitData={onSyncData}/>
          <Button onClick={onSaveData} type="primary">保存</Button>
        </>
      }
    >
    </Tabs>
  </div>)
}
