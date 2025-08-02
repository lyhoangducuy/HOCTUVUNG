import React, { useState } from "react";
import { useNavigate } from "react-router-dom";  // Để điều hướng sau khi form được submit
import './DangKy.css'; // Đảm bảo đã tạo file CSS riêng để style form

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    position: 'Học Viên',
    password: ''
  });

  const [error, setError] = useState('');

  // Hàm xử lý thay đổi giá trị trường nhập liệu
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  // Hàm xử lý submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.username || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin');
    } else {
      setError('');
      console.log('Form Submitted:', formData);
      // Điều hướng tới trang khác sau khi submit
      navigate('/', { state: formData });
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2>Đăng ký</h2>

        <div className="social-login">
          <button className="google-btn">Đăng ký bằng Google</button>
          <button className="facebook-btn">Đăng ký bằng Facebook</button>
        </div>

        <form onSubmit={handleSubmit}>
          <p>hoặc email</p>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Nhập email"
              required
            />
          </div>

          <div className="form-group">
            <label>Tên người dùng</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Nhập tên người dùng"
              required
            />
          </div>

          <div className="form-group">
            <label>Vị trí</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              required
            >
              <option value="Học Viên">Học Viên</option>
              <option value="Giảng Viên">Giảng Viên</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="submit-button">Đăng ký</button>
        </form>
      </div>
    </div>
  );
}
