import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Toast,
  Space,
  Divider,
  Switch
} from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline, UserOutline } from 'antd-mobile-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EMAIL_REG } from '@/constant';
import { login } from '@/api/index.js';
import './index.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isDriver, setIsDriver] = useState(false);

  const role = searchParams.get('role');

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
    console.log("🚀 --- values:", values)
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
        else {
          Toast.show({
            content: 'Login successful!',
            position: 'center',
          });
          // Redirect based on toggle state
          if (isDriver) {
            navigate('/driver');
          } else {
            navigate('/passenger');
          }
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
          <p>Sign in to your account to continue</p>
          {/* Role Switcher */}
          <div className="role-switcher">
            <div className={`role-option ${!isDriver ? 'active' : ''}`}>
              <UserOutline className="role-icon" />
              <span>Passenger</span>
            </div>
            <Switch
              checked={isDriver}
              onChange={setIsDriver}
              className="role-toggle"
            />
            <div className={`role-option ${isDriver ? 'active' : ''}`}>
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
              type={passwordVisible ? 'text' : 'password'}
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
            <span>Don't have an account?</span>
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