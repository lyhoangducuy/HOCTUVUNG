import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function DangNhap() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [matkhau, setMatkhau] = useState('');
  const [error, setError] = useState('');

  const handleDangNhap = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:8080/api/nguoidung/dangnhap', {
        email,
        matkhau,
      });

      if (response.data) {
        alert('Đăng nhập thành công!');
        navigate('/'); // 👉 chuyển trang sau khi đăng nhập
      } else {
        setError('Sai email hoặc mật khẩu.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối hoặc máy chủ.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', paddingTop: '40px' }}>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleDangNhap}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Mật khẩu:</label><br />
          <input
            type="password"
            value={matkhau}
            onChange={e => setMatkhau(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>Đăng nhập</button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
