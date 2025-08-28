// src/components/Header/AccountMenu.jsx
import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faReceipt, faWallet } from "@fortawesome/free-solid-svg-icons";
import "../header.css";

import { db } from "../../../../../lib/firebase"; // chỉnh path nếu khác
import { doc, onSnapshot } from "firebase/firestore";

const VN = "vi-VN";
const fmtMoney = (n, donVi = "VND") => {
  const v = Number(n || 0);
  if (donVi === "VND") return v.toLocaleString(VN) + " đ";
  return `${v.toLocaleString(VN)} ${donVi}`;
};

export default function AccountMenu({ user, prime, balanceText, onLogout, navigate }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  // ví realtime từ collection 'vi'
  const [wallet, setWallet] = useState({ soDu: null, donVi: "VND", _loaded: false });

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // uid hiện tại (ưu tiên idNguoiDung, fallback uid)
  const uid = user?.idNguoiDung || user?.uid || null;

  useEffect(() => {
    if (!uid) { setWallet({ soDu: null, donVi: "VND", _loaded: false }); return; }

    // 🔁 subscribe ví: vi/{uid}
    const unsub = onSnapshot(
      doc(db, "vi", String(uid)),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() || {};
          setWallet({
            soDu: Number(data.soDu || 0),
            donVi: data.donVi || "VND",
            _loaded: true,
          });
        } else {
          // chưa có ví → hiển thị 0
          setWallet({ soDu: 0, donVi: "VND", _loaded: true });
        }
      },
      () => setWallet({ soDu: null, donVi: "VND", _loaded: false })
    );

    return () => unsub();
  }, [uid]);

  const avatarSrc = user?.anhDaiDien || "";
  const displayName = user?.tenNguoiDung || "Người dùng";

  // Text số dư: ưu tiên dữ liệu từ 'vi'; fallback prop cũ nếu chưa load
  const soDuText = wallet._loaded ? fmtMoney(wallet.soDu, wallet.donVi) : (balanceText || "—");

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

          <div className="confirg" onClick={() => { setOpen(false); navigate("/vi"); }}>
            <FontAwesomeIcon icon={faWallet} className="icon icon-setting" />
            <span className="confirg-text">Ví</span>
            <span className="balance-text" style={{ marginLeft: 8, fontWeight: 600 }}>
              {soDuText}
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
