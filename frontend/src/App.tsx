import './App.css'
import {MyRouter} from "./routes";
import { Provider } from 'react-redux';
import { persistor, store } from './store';
import {PersistGate} from "redux-persist/integration/react";
import {ConfigProvider} from "antd";
import zhCN from 'antd/lib/locale/zh_CN';
import 'antd/dist/antd.css'
import 'planning-tools/dist/umd/planning-tools.min.css'

function App() {
    return (
    <>
      <Provider store={store}>
        <PersistGate loading persistor={persistor}>
          <ConfigProvider locale={zhCN}>
            <MyRouter />
          </ConfigProvider>
        </PersistGate>
      </Provider>
    </>
  )
}

export default App
