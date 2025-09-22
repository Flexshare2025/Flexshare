import { useState, useRef, useEffect } from 'react';
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
import { encryptUserData } from '@/utils/crypto';
import './index.css';
// generate a random 4-character captcha code
function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
// draw captcha on canvas
function drawCaptcha(canvas, code) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 100, 40);
  ctx.fillStyle = '#f4f4f4';
  ctx.fillRect(0, 0, 100, 40);
  ctx.font = '24px Arial';
  ctx.fillStyle = '#333';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, 18, 22);
  // add some noise lines
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = '#bbb';
    ctx.beginPath();
    ctx.moveTo(Math.random() * 100, Math.random() * 40);
    ctx.lineTo(Math.random() * 100, Math.random() * 40);
    ctx.stroke();
  }
}
const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  // Captcha state
  const [captcha, setCaptcha] = useState(generateCaptcha());
  //2 minute expiration time
  const [captchaExpireTime, setCaptchaExpireTime] = useState(Date.now() + 2 * 60 * 1000);
  const [captchaInput, setCaptchaInput] = useState('');
  const captchaCanvasRef = useRef(null);
  useEffect(() => {
    if (captchaCanvasRef.current) {
      drawCaptcha(captchaCanvasRef.current, captcha);
    }
  }, [captcha]);
  // Role options
  const roleOptions = [
    { label: 'Passenger', value: 'passenger' },
    { label: 'Driver', value: 'driver' }
  ];
  // Refresh captcha and reset expiration time
  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaExpireTime(Date.now() + 2 * 60 * 1000); // 更新有效期
  };
  // Handle email verification
  const handleSendVerificationCode = async () => {
    const email = form.getFieldValue('email');
    console.log("🚀 --- email:", email)
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
    // Validate captcha before sending mail verification
    if (!captchaInput || captchaInput.trim().length === 0) {
      Toast.show({
        content: 'Please enter captcha',
        position: 'center',
      });
      return;
    }
    if (Date.now() > captchaExpireTime) {
      Toast.show({
        content: 'Captcha expired, please refresh',
        position: 'center',
      });
      return;
    }
    if (captchaInput.trim().toUpperCase() !== captcha) {
      Toast.show({
        content: 'Incorrect captcha code',
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
          content: 'Failed to send verification code: ' + error,
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
    // delete captcha from values
    delete values.captcha;

    // Validate captcha
    if (captchaInput.trim().toUpperCase() !== captcha) {
      Toast.show({
        content: 'Incorrect captcha code',
        position: 'center',
      });
      setCaptcha(generateCaptcha());
      setCaptchaInput('');
      return;
    }
    //In value role is an array, and when you take it out, you need a string
    const normalizedValues = {
      ...values,
      role: Array.isArray(values.role) ? (values.role[0] || '') : values.role,
    };

    // encrypt the password
    const encryptedData = encryptUserData(normalizedValues);
    setLoading(true);
    register({
      data: encryptedData,
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
  return (
    <div className="register-page">
      <div className="register-content">
        <div className="register-header">
          <h2>Create New Account</h2>
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
            name="captcha"
            label="captcha"
            required
            rules={[
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.reject(new Error('Please enter captcha'));
                  }
                  if (Date.now() > captchaExpireTime) {
                    return Promise.reject(new Error('Captcha expired, please refresh'));
                  }
                  if (value.trim().toUpperCase() !== captcha) {
                    return Promise.reject(new Error('Incorrect captcha code'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <canvas
                  ref={captchaCanvasRef}
                  width={100}
                  height={40}
                  style={{ borderRadius: 4, border: '1px solid #eee', background: '#f4f4f4', cursor: 'pointer' }}
                  onClick={() => refreshCaptcha()}
                  title="Click to refresh"
                />
              </div>
            }
          >
            <Input
              placeholder="Enter captcha"
              value={captchaInput}
              onChange={setCaptchaInput}
              clearable
              maxLength={4}
            />
          </Form.Item>
          <Form.Item
            name="mail_verification"
            label="Email Verification Code"
            rules={[
              { required: true, message: 'Please enter verification code' },
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
