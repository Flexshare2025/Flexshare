import { HashRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd-mobile";
import enUS from 'antd-mobile/es/locales/en-US';
import Login from "@/pages/Login";
import DriverInfoUpload from "@/pages/Driver/InfoUpload";
import PublishRoute from "@/pages/Driver/PublishRoute";
import Passenger from "@/pages/Passenger";
import NotFound from "@/pages/NotFound";
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
          <Route path="/passenger" element={<Passenger />} />
          <Route element={<NotFound />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </HashRouter>
    </ConfigProvider>
  )
}

