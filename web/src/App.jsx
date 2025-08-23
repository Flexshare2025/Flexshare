import { HashRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd-mobile";
import enUS from 'antd-mobile/es/locales/en-US';
import Login from "@/pages/Login";
import DriverInfoUpload from "@/pages/Driver/InfoUpload";
import PublishRoute from "@/pages/Driver/PublishRoute";
import Customer from "@/pages/Customer";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Register from "@/pages/Register";

export default function App() {
  return (
    <ConfigProvider
      locale={enUS}
    >
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/driver/upload" element={<DriverInfoUpload />} />
          <Route path="/driver/publish" element={<PublishRoute />} />
          <Route path="/customer" element={<Customer />} />
          <Route element={<NotFound />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} exit />
        </Routes>
      </HashRouter>
    </ConfigProvider>
  )
}

