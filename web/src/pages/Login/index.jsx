import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Toast,
  Space,
  Divider
} from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline, UserOutline } from 'antd-mobile-icons';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { EMAIL_REG } from '@/constant';
import { login } from '@/api/index.js';
import { setLocalData } from '@/utils/storage';
import { FLEXSHARE_ACCESS_TOKEN } from '@/constant';
import './index.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isDriver, setIsDriver] = useState(false);

  const role = searchParams.get('role');
  const from = location.state?.from; // Get the page user was trying to access

  // Set initial role based on URL parameter
  React.useEffect(() => {
    if (role === 'driver') {
      setIsDriver(true);
    } else if (role === 'passenger') {
      setIsDriver(false);
    }
  }, [role]);

  // Handle form submission
  const handleSubmit = async (values) => {
    values.role = isDriver ? 'driver' : 'passenger'
    setLoading(true);

    login({
      data: values,
      success: (result) => {
        if (result.code == '4002') {
          Toast.show({
            content: result.msg,
            position: 'center',
          });
        }
        else if (result.code == '200') {
          // Save token to cookie
          if (result.data) {
            setLocalData({ key: FLEXSHARE_ACCESS_TOKEN, value: result.data });
          }

          Toast.show({
            content: 'Login successful!',
            position: 'center',
          });
          // Redirect logic: prioritize 'from' path, then role-based redirect
          if (from) {
            // Redirect to the page user was originally trying to access
            navigate(from);
          } else {
            // Default role-based redirect
            if (isDriver) {
              navigate('/driver/publish');
            } else {
              navigate('/passenger');
            }
          }
        } else {
          Toast.show({
            content: result.message,
            position: 'center',
          });
        }
      },
      fail: (error) => {
        console.error('❌ Login failed:', error);
        Toast.show({
          content: `Login failed: ${error}`,
          position: 'center',
        });
      },
      done: () => {
        setLoading(false);
      }
    });
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-header">
          <h2>Welcome Back</h2>
          {/* Role Switcher */}
          <div className="role-switcher">
            <div
              className={`role-option ${!isDriver ? 'active' : ''}`}
              onClick={() => setIsDriver(false)}
            >
              <UserOutline className="role-icon" />
              <span>Passenger</span>
            </div>
            <div
              className={`role-option ${isDriver ? 'active' : ''}`}
              onClick={() => setIsDriver(true)}
            >
              <UserOutline className="role-icon" />
              <span>Driver</span>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          footer={
            <Button
              block
              type="submit"
              color="primary"
              size="large"
              loading={loading}
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Signing In...' : `Sign In as ${isDriver ? 'Driver' : 'Passenger'}`}
            </Button>
          }
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email address' },
              { pattern: EMAIL_REG, message: 'Please enter valid email format' }
            ]}
          >
            <Input
              placeholder="Please enter email address"
              type="email"
              clearable
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter password' }
            ]}
          >
            <Input
              placeholder="Please enter password"
              type="password"
              clearable
              extra={
                <div onClick={() => setPasswordVisible(!passwordVisible)}>
                  {passwordVisible ? <EyeOutline /> : <EyeInvisibleOutline />}
                </div>
              }
            />
          </Form.Item>
        </Form>

        <Divider>
          <Space>
            <Button
              fill="none"
              color="danger"
              size="small"
              onClick={() => navigate('/forgot-password')}
            >
              Forget password?
            </Button>
            <Button
              fill="none"
              color="primary"
              size="small"
              onClick={() => navigate('/register')}
            >
              Create Account
            </Button>
          </Space>
        </Divider>
      </div>
    </div>
  );
}