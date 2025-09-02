import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd-mobile";
import enUS from 'antd-mobile/es/locales/en-US';
import Login from "@/pages/Login";
import DriverInfoUpload from "@/pages/Driver/InfoUpload";
import DriverPublishRoute from "@/pages/Driver/PublishRoute";
import DriverRode from "@/pages/Driver/Rode";
import Driver from "@/pages/Driver";
import Passenger from "@/pages/Passenger";
import NotFound from "@/pages/NotFound";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        '--adm-color-primary': '#667eea',
        '--adm-color-primary-hover': '#5a6fd8',
        '--adm-color-primary-pressed': '#4c5ec0',
        '--adm-border-radius': '12px',
        '--adm-color-text': '#333',
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* Protected Routes */}
          <Route path="/driver/*" element={
            // <ProtectedRoute requiredRole="driver">
            <Driver />
            // </ProtectedRoute>
          } >
            <Route path="publish" element={
              <DriverPublishRoute />
            } />
            <Route path="rode" element={
              <DriverRode />
            } />
          </Route>
          <Route path="/driver/upload" element={
            <DriverInfoUpload />
          } />

          <Route path="/passenger" element={
            <ProtectedRoute requiredRole="passenger">
              <Passenger />
            </ProtectedRoute>
          } />
          <Route path="/passenger" element={
            <ProtectedRoute requiredRole="passenger">
              <Passenger />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

