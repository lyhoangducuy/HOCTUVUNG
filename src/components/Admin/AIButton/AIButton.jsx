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

  // theo dõi user + Prime
  const [user, setUser] = useState(null);
  const [prime, setPrime] = useState(false);

  // ADMIN được bypass prime
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Auth ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsubAuth();
  }, []);

  // --- traPhi & role từ hồ sơ ---
  useEffect(() => {
    if (!user?.uid) {
      setPrime(false);
      setIsAdmin(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "nguoiDung", String(user.uid)),
      (snap) => {
        const data = snap.data() || {};
        setPrime(Boolean(data.traPhi)); // true => Prime

        // cố gắng bắt nhiều kiểu lưu role khác nhau
        const adminLike = (data.role || data.vaiTro || data.quyen || "")
          .toString()
          .toUpperCase();
        const isAdminComputed =
          adminLike === "ADMIN" ||
          data.isAdmin === true ||
          (Array.isArray(data.roles) &&
            data.roles.some((r) => String(r).toUpperCase() === "ADMIN"));

        setIsAdmin(Boolean(isAdminComputed));
      },
      () => {
        setPrime(false);
        setIsAdmin(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  // --- outside click ---
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
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

  // Tạo bộ thẻ: BỎ BẮT ĐĂNG NHẬP
  // - Nếu CHƯA đăng nhập: cho mở form tự do (không chặn)
  // - Nếu ĐÃ đăng nhập: chỉ chặn khi KHÔNG prime & KHÔNG admin
  const openCreateForm = () => {
    if (loading) return;

    if (!user) {
      alert("Vui lòng đăng nhập để dùng tính năng Tạo bộ thẻ.");
      navigate("/dang-nhap");
      return;
    }
    if (!prime && !isAdmin) {
      alert("Bạn cần nâng cấp tài khoản để dùng tính năng Tạo bộ thẻ.");
      navigate("/tra-phi");
      return;
    }

    setShowForm(true);
    setOpen(false);
  };

  // Khoá badge chỉ hiển thị khi user đã đăng nhập mà không có quyền
  const lockedByPlan = user ? !prime && !isAdmin : false;

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

          {/* Tạo bộ thẻ: cho khách mở tự do; user thường cần Prime; ADMIN bypass */}
          <div
            className={`ai-item${loading ? " disabled" : ""}`}
            onClick={!loading ? openCreateForm : undefined}
            title={
              lockedByPlan ? "Cần nâng cấp để mở" : "Tạo bộ thẻ theo chủ đề"
            }
          >
            {loading ? (
              "Đang tạo..."
            ) : (
              <>
                AI tạo bộ thẻ theo chủ đề
                {lockedByPlan && (
                  <span
                    className="prime-badge"
                    aria-hidden="true"
                    title="Nâng cấp để mở khóa"
                  >
                    ★
                  </span>
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
        user={user || auth.currentUser /* có thể là null nếu khách */}
        onBusyChange={setLoading}
      />
    </div>
  );
}
