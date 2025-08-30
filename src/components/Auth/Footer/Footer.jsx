  import React from "react";
  import "./Footer.css";

  export default function Footer() {
    const year = new Date().getFullYear();

    return (
      <footer className="footer" aria-label="Footer">
        <div className="footer-container">
          {/* Logo + mô tả */}
          <div className="footer-col">
            <h2 className="footer-logo">HOCTUVUNG</h2>
            <p className="footer-desc">
              Nền tảng học từ vựng thông minh, giúp bạn học nhanh – nhớ lâu.
            </p>
          </div>

          {/* Liên kết nhanh */}
          <nav className="footer-col" aria-label="Liên kết nhanh">
            <h4>Liên kết nhanh</h4>
            <ul className="footer-links">
              <li><a href="/landingpage">Trang chủ</a></li>
              <li><a href="/landingpage">Giới thiệu</a></li>
              <li><a href="/courses">Khóa học</a></li>
              <li><a href="/contact">Liên hệ</a></li>
            </ul>
          </nav>

          {/* Thông tin liên hệ */}
          <div className="footer-col">
            <h4>Liên hệ</h4>
            <p>Email: <a href="mailto:support@hoctuvung.com">support@hoctuvung.com</a></p>
            <p>Điện thoại: <a href="tel:+84123456789">+84 123 456 789</a></p>
            <div className="social-icons" aria-label="Mạng xã hội">
              <a href="#" aria-label="Facebook" rel="noopener" title="Facebook">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#" aria-label="YouTube" rel="noopener" title="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
              <a href="#" aria-label="GitHub" rel="noopener" title="GitHub">
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Bản quyền */}
        <div className="footer-bottom">
          <p>© {year} HOCTUVUNG. All rights reserved.</p>
        </div>
      </footer>
    );
  }
