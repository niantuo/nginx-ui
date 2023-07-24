import {Spin} from "antd";
import './index.less'


export const EmptyLoading = ()=>{
    return (
        <div className="empty-loading">
            <Spin></Spin>
            <div className="hint-msg">加载中,请稍等...</div>
        </div>
    )
}