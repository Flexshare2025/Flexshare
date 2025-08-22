import { HashRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd-mobile";
import enUS from 'antd-mobile/es/locales/en-US';
import Login from "@/pages/Login";
import DriverInfoUpload from "@/pages/Driver/InfoUpload";
import Driver from "@/pages/Driver";
import Customer from "@/pages/Customer";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <ConfigProvider locale={enUS}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} exit />
          <Route path="/driver" element={<Driver />} />
          <Route path="/driver/upload" element={<DriverInfoUpload />} />
          <Route path="/customer" element={<Customer />} />
          <Route element={<NotFound />} />
        </Routes>
      </HashRouter>
    </ConfigProvider>
  )
}

