import { HashRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd-mobile";
import enUS from 'antd-mobile/es/locales/en-US'
import Login from "@/pages/Login";
import Driver from "@/pages/Driver";
import Customer from "@/pages/Customer";
export default function App() {

  return (
    <ConfigProvider locale={enUS}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/driver" element={<Driver />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </ConfigProvider>
  )
}

