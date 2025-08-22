import React from 'react';
import { Button, Space, Divider } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Welcome to FlexShare</h2>
      <p style={{ marginTop: 0, color: '#666' }}>Please choose your role to continue</p>

      <div style={{ marginTop: 24 }}>
        <Space direction="vertical" block size={24}>
          <Button
            block
            color="primary"
            size="large"
            onClick={() => navigate('/login?role=driver')}
          >
            Driver Login
          </Button>

          <Button
            block
            color="warning"
            size="large"
            onClick={() => navigate('/login?role=passenger')}
          >
            Passenger Login
          </Button>
        </Space>
      </div>

      <Divider>Or</Divider>

      <div>
        <Space block>
          <Button size="small" fill="none" onClick={() => navigate('/register')}>Create Account</Button>
        </Space>
      </div>
    </div>
  );
}
