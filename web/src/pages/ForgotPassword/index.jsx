import { useState } from 'react';
import { Form, Input, Button, Toast, Divider, Space } from 'antd-mobile';
import { EMAIL_REG, PW_REG } from '@/constant';
import { emailVerification, resetPassword } from '@/api/index.js';
import { useNavigate } from 'react-router-dom';
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      Toast.show({ content: 'Please enter email address', position: 'center' });
      return;
    }
    if (!EMAIL_REG.test(email)) {
      Toast.show({ content: 'Please enter valid email format', position: 'center' });
      return;
    }

    setSending(true);
    emailVerification({
      data: { email },
      success: () => {
        Toast.show({ content: 'Verification code sent', position: 'center' });
        setCountdown(60);
        const t = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(t);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      },
      fail: (error) => {
        Toast.show({ content: 'Failed to send code: ' + error, position: 'center' });
      },
      done: () => setSending(false)
    });
  };

  const handleReset = async (values) => {
    setLoading(true);
    resetPassword({
      data: values,
      success: (result) => {
        if (result.code && String(result.code) != '200') {
          Toast.show({ content: result.msg || 'Reset failed', position: 'center' });
        } else {
          Toast.show({ content: 'Password reset successfully', position: 'center' });
          setTimeout(() => navigate('/login'), 500);
        }
      },
      fail: (error) => {
        Toast.show({ content: 'Reset failed: ' + error, position: 'center' });
      },
      done: () => setLoading(false)
    });
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-header">
          <h2>Reset Password</h2>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleReset}
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
              Reset Password
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
            <Input placeholder="Please enter email address" type="email" clearable />
          </Form.Item>

          <Form.Item
            name="mail_verification"
            label="Verification Code"
            rules={[
              { required: true, message: 'Please enter verification code' },
              { len: 6, message: 'Verification code should be 6 digits' }
            ]}
            extra={
              <Button
                size="small"
                color="primary"
                fill="outline"
                loading={sending}
                disabled={sending || countdown > 0}
                onClick={handleSendCode}
              >
                {sending ? 'Sending...' : (countdown > 0 ? `Retry in ${countdown}s` : 'Send Code')}
              </Button>
            }
          >
            <Input placeholder="Enter 6-digit code" type="number" maxLength={6} clearable />
          </Form.Item>

          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { pattern: PW_REG, message: 'Password should be 8-20 characters' }
            ]}
          >
            <Input placeholder="Please enter new password" type="password" clearable />
          </Form.Item>
        </Form>

        <Divider>
          <Space>
            <Button fill="none" color="primary" size="small" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </Space>
        </Divider>
      </div>
    </div>
  );
}


