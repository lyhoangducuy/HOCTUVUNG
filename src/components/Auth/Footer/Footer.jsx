import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Cột 1: Logo / mô tả */}
        <div className="footer-col">
          <h2 className="footer-logo">HOCTUVUNG</h2>
          <p>Nền tảng học từ vựng thông minh dành cho sinh viên và người đi làm.</p>
        </div>

        {/* Cột 2: Liên kết nhanh */}
        <div className="footer-col">
          <h4>Liên kết</h4>
          <ul>
            <li><a href="/landingpage">Trang chủ</a></li>
            <li><a href="/landingpage">Giới thiệu</a></li>
            <li><a href="/courses">Khóa học</a></li>
            <li><a href="/contact">Liên hệ</a></li>
          </ul>
        </div>

        {/* Cột 3: Liên hệ */}
        <div className="footer-col">
          <h4>Liên hệ</h4>
          <p>Email: support@hoctuvung.com</p>
          <p>Điện thoại: +84 123 456 789</p>
          <div className="social-icons">
            <a href="#"><i className="fab fa-facebook"></i></a>
            <a href="#"><i className="fab fa-youtube"></i></a>
            <a href="#"><i className="fab fa-github"></i></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2023 HOCTUVUNG. All rights reserved.</p>
      </div>
    </footer>
  );
}
