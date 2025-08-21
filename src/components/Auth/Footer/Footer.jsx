  import React from "react";
  import "./Footer.css";

  export default function Footer() {
    return (
      <footer className="footer">
        <div className="footer-container">
          
          {/* Logo + mô tả */}
          <div className="footer-col">
            <h2 className="footer-logo">HOCTUVUNG</h2>
            <p>
              Nền tảng học từ vựng thông minh dành cho sinh viên và người đi làm.
            </p>
          </div>

          {/* Liên kết nhanh */}
          <div className="footer-col">
            <h4>Liên kết nhanh</h4>
            <ul>
              <li><a href="/landingpage">Trang chủ</a></li>
              <li><a href="/landingpage">Giới thiệu</a></li>
              <li><a href="/courses">Khóa học</a></li>
              <li><a href="/contact">Liên hệ</a></li>
            </ul>
          </div>

          {/* Thông tin liên hệ */}
          <div className="footer-col">
            <h4>Liên hệ</h4>
            <p>Email: <a href="mailto:support@hoctuvung.com">support@hoctuvung.com</a></p>
            <p>Điện thoại: <a href="tel:+84123456789">+84 123 456 789</a></p>
            <div className="social-icons">
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-youtube"></i></a>
              <a href="#"><i className="fab fa-github"></i></a>
            </div>
          </div>
        </div>

        {/* Bản quyền */}
        <div className="footer-bottom">
          <p>© 2025 HOCTUVUNG. All rights reserved.</p>
        </div>
      </footer>
    );
  }
