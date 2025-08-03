import React from 'react';
import { Link } from 'react-router-dom';
import './DangKyHeader.css'; // import file CSS riêng

export default function DangKyHeader() {
  return (
    <header className="header-container">
      <div className="header-wrapper">
        <nav className="header-nav">
          <Link to="/">
            <svg  className="logo-svg" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="35"  fontWeight="bold" fontFamily="Arial, sans-serif" fill="#2953F3">
                HOCTUVUNG
              </text>
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}
