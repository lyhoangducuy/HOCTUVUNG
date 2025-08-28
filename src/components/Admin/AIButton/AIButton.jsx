// src/components/AIButton.jsx
import { useEffect, useRef, useState } from "react";
import { FaRobot } from "react-icons/fa";
import "./AIButton.css";

import HelpBot from "../ChatAI/HelpBot";
import TaoBoTheAI from "./chucNang/TaoBoTheAI";

import { useNavigate } from "react-router-dom";

// Firebase
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export default function AIButton() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // giống Sidebar: theo dõi user + traPhi
  const [user, setUser] = useState(null);
  const [prime, setPrime] = useState(false);

  // --- Auth ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsubAuth();
  }, []);

  // --- traPhi từ hồ sơ ---
  useEffect(() => {
    if (!user?.uid) {
      setPrime(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "nguoiDung", String(user.uid)),
      (snap) => {
        const data = snap.data() || {};
        setPrime(Boolean(data.traPhi)); // true => Prime
      },
      () => setPrime(false)
    );
    return () => unsub();
  }, [user?.uid]);

  // --- outside click ---
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Chat trợ giúp: mở tự do
  const openHelpChat = () => {
    setShowHelp(true);
    window.dispatchEvent(new Event("helpbot:open"));
    setOpen(false);
  };

  // Tạo bộ thẻ: giống gotoVideo()
  const openCreateForm = () => {
    if (loading) return;
    if (!user) {
      alert("Vui lòng đăng nhập để dùng tính năng Tạo bộ thẻ.");
      navigate("/dang-nhap");
      return;
    }
    if (!prime) {
      alert("Bạn cần nâng cấp tài khoản để dùng tính năng Tạo bộ thẻ.");
      navigate("/tra-phi");
      return;
    }
    setShowForm(true);
    setOpen(false);
  };

  return (
    <div className="ai-button-container" ref={menuRef}>
      <button
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        title="AI trợ giúp"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <FaRobot />
      </button>

      {open && (
        <div className="ai-dropdown">
          <div className="ai-item" onClick={openHelpChat}>
            Chat trợ giúp
          </div>
          {/* Tạo bộ thẻ: cần Prime */}
          <div
            className={`ai-item${loading ? " disabled" : ""}`}
            onClick={!loading ? openCreateForm : undefined}
            title={!prime ? "Cần nâng cấp để mở" : "Tạo bộ thẻ theo chủ đề"}
          >
            {loading ? (
              "Đang tạo..."
            ) : (
              <>
                Tạo bộ thẻ theo chủ đề
                {!prime && (
                  <span className="prime-badge" aria-hidden="true" title="Nâng cấp để mở khóa">★</span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showHelp && <HelpBot defaultOpen={true} />}

      <TaoBoTheAI
        open={showForm}
        onClose={() => setShowForm(false)}
        user={user}
        onBusyChange={setLoading}
      />

    </div>
  );
}
