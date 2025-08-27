import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faReceipt, faWallet } from "@fortawesome/free-solid-svg-icons";
import "../header.css";

export default function AccountMenu({ user, prime, balanceText, onLogout, navigate }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const outside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const avatarSrc = user?.anhDaiDien || "";
  const displayName = user?.tenNguoiDung || "Người dùng";

  return (
    <div className="inforContainer" ref={ref}>
      <div className="avatar-wrapper" onClick={() => setOpen((v) => !v)}>
        {avatarSrc ? (
          <img src={avatarSrc} alt="avatar" className="avatar" />
        ) : (
          <div className="avatar avatar-fallback">
            {(displayName || "U").charAt(0).toUpperCase()}
          </div>
        )}
        {prime && <span className="prime-badge" title="Tài khoản Prime">★</span>}
      </div>

      {open && (
        <div className="setting">
          <div className="infor">
            <div className="avatar-wrapper">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="avatar" />
              ) : (
                <div className="avatar avatar-fallback">
                  {(displayName || "U").charAt(0).toUpperCase()}
                </div>
              )}
              {prime && <span className="prime-badge" title="Tài khoản Prime">★</span>}
            </div>
            <h2 className="tittle">{displayName}</h2>
          </div>

          <div className="divide" />

          <div
            className="confirg"
            onClick={() => { setOpen(false); navigate("/so-du"); }}
          >
            <FontAwesomeIcon icon={faWallet} className="icon icon-setting" />
            <span className="confirg-text">Số dư</span>
            <span className="balance-text" style={{ marginLeft: 8, fontWeight: 600 }}>
              {balanceText}
            </span>
          </div>

          <div className="divide" />

          <div className="confirg" onClick={() => { setOpen(false); navigate("/setting"); }}>
            <FontAwesomeIcon icon={faGear} className="icon icon-setting" />
            <span className="confirg-text">Cài đặt</span>
          </div>

          <div className="divide" />

          <div className="confirg" onClick={() => { setOpen(false); navigate("/lichSuThanhToan"); }}>
            <FontAwesomeIcon icon={faReceipt} className="icon icon-setting" />
            <span className="confirg-text">Lịch sử thanh toán</span>
          </div>

          <div className="divide" />
          <div className="loggout" onClick={onLogout}>Đăng xuất</div>
        </div>
      )}
    </div>
  );
}
