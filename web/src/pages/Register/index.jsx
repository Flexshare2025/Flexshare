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
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  // background with subtle gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f6f7f9');
  gradient.addColorStop(1, '#e9ebef');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // random noise dots
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = randomColor(150, 220);
    ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
  }

  // interference bezier curves
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = randomColor(40, 120); // darker lines
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.bezierCurveTo(
      Math.random() * width,
      Math.random() * height,
      Math.random() * width,
      Math.random() * height,
      Math.random() * width,
      Math.random() * height
    );
    ctx.stroke();
  }

  // draw characters with random rotation/size/color
  ctx.textBaseline = 'middle';
  const charStep = width / (code.length + 1);
  for (let i = 0; i < code.length; i++) {
    const fontSize = 20 + Math.floor(Math.random() * 10); // 20-30
    const angle = Math.random() * 0.6 - 0.3; // -0.3 ~ 0.3 rad
    const x = (i + 1) * charStep + (Math.random() * 4 - 2);
    const y = height / 2 + (Math.random() * 6 - 3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = randomColor(50, 160);
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 1;
    ctx.fillText(code[i], -fontSize / 2.5, 0);
    ctx.restore();
  }

  // wavy overlay line
  ctx.strokeStyle = 'rgba(60,80,120,0.7)'; // darker and less transparent
  ctx.lineWidth = 1;
  ctx.beginPath();
  const amplitude = 3 + Math.random() * 2;
  const frequency = 0.15 + Math.random() * 0.1;
  for (let x = 0; x < width; x += 2) {
    const y = height / 2 + Math.sin(x * frequency) * amplitude;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  function randomColor(min = 0, max = 255) {
    const r = Math.floor(min + Math.random() * (max - min));
    const g = Math.floor(min + Math.random() * (max - min));
    const b = Math.floor(min + Math.random() * (max - min));
    return `rgb(${r},${g},${b})`;
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
        if (result.code == '4004' || result.code == '4006') {
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
