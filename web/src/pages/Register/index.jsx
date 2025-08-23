import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Selector,
  Toast,
  Space,
  Divider
} from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { register, emailVerification } from '@/api/index.js';
import { EMAIL_REG, PW_REG } from '@/constant';
import './index.css';

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Role options
  const roleOptions = [
    { label: 'Passenger', value: 'passenger' },
    { label: 'Driver', value: 'driver' }
  ];

  // Handle email verification
  const handleSendVerificationCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      Toast.show({
        content: 'Please enter your email address first',
        position: 'center',
      });
      return;
    }

    if (!EMAIL_REG.test(email)) {
      Toast.show({
        content: 'Please enter a valid email format',
        position: 'center',
      });
      return;
    }

    setVerificationLoading(true);

    emailVerification({
      data: { email },
      success: (result) => {
        Toast.show({
          content: 'Verification code has been sent to your email',
          position: 'center',
        });
        // Start countdown
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      },
      fail: (error) => {
        Toast.show({
          content: 'Failed to send verification code, please try again',
          position: 'center',
        });
      },
      done: () => {
        setVerificationLoading(false);
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    //In value role is an array, and when you take it out, you need a string
    const normalizedValues = {
      ...values,
      role: Array.isArray(values.role) ? (values.role[0] || '') : values.role,
    };
    setLoading(true);
    register({
      data: normalizedValues,
      success: (result) => {
        console.log('Registration success:', result);
        if (result.code == '4004') {
          Toast.show({
            content: result.msg,
            position: 'center',
          });
        } else {
          Toast.show({
            content: 'Registration successful!',
            position: 'center',
          });
          setTimeout(() => {
            navigate(`/login?${normalizedValues.role}`);
          }, 500);
        }
      },
      fail: (error) => {
        console.error('Registration failed:', error);
        Toast.show({
          content: `Registration failed: ${error}`,
          position: 'center',
        });
      },
      done: () => {
        setLoading(false);
      }
    });
  };


  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="register-page">
      <div className="register-content">
        <div className="register-header">
          <h2>Create New Account</h2>
          <p>Please fill in the following information to complete registration</p>
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
              {loading ? 'Registering...' : 'Register Now'}
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
              { required: true, message: 'Please enter password' },
              { pattern: PW_REG, message: 'Password should be 8-20 characters' }
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

          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Please enter name' },
              { min: 2, message: 'Name should be at least 2 characters' }
            ]}
          >
            <Input
              placeholder="Please enter name"
              clearable
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="User Role"
            rules={[
              { required: true, message: 'Please select user role' }
            ]}
          >
            <Selector
              options={roleOptions}
              columns={2}
              className="role-selector"
            />
          </Form.Item>

          <Form.Item
            name="verification_code"
            label="Email Verification Code"
            rules={[
              { required: false, message: 'Please enter verification code' },
              { len: 6, message: 'Verification code should be 6 digits' }
            ]}
            extra={
              <Button
                size="small"
                color="primary"
                fill="outline"
                loading={verificationLoading}
                disabled={verificationLoading || countdown > 0}
                onClick={handleSendVerificationCode}
                className="verification-btn"
              >
                {verificationLoading ? 'Sending...' : (countdown > 0 ? `Retry in ${countdown}s` : 'Send Code')}
              </Button>
            }
          >
            <Input
              placeholder="Please enter 6-digit code"
              type="number"
              maxLength={6}
              clearable
            />
          </Form.Item>
        </Form>

        <Divider>
          <Space>
            <span>Already have an account?</span>
            <Button
              fill="none"
              color="primary"
              size="small"
              onClick={() => navigate('/login')}
            >
              Login Now
            </Button>
          </Space>
        </Divider>
      </div>
    </div>
  );
};

export default Register;
