import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Login() {
  const [searchParams] = useSearchParams(); // use useSearchParams Get query parameters
  const role = searchParams.get('role'); //
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>
        Welcome to FlexShare, {role || 'Guest'}
      </h2>
    </div>
  );
}