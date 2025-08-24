import React, { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./TrangChu.css";
import AIButton from "../../../components/Admin/AIButton/AIButton";
import { FaRobot } from "react-icons/fa";

export default function TrangChu() {
  const navigate = useNavigate();
  const [dsBoThe, setDsBoThe] = useState([]);
  const [prime, setPrime] = useState(false); // chỉ prime mới dùng AI thật

  // helpers
  const parseVNDate = (dmy) => {
    if (!dmy || typeof dmy !== "string") return null; // "dd/mm/yyyy"
    const [d, m, y] = dmy.split("/").map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const hasActiveSub = (userId) => {
    try {
      const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
      const today = new Date();
      return Array.isArray(subs) && subs.some((s) => {
        if (String(s.idNguoiDung) !== String(userId)) return false;
        if (s.status === "Đã hủy") return false;
        const end = parseVNDate(s.NgayKetThuc);
        return end && end >= today;
      });
    } catch {
      return false;
    }
  };

  // xét prime theo session + localStorage
  useEffect(() => {
    const computePrime = () => {
      try {
        const ss = JSON.parse(sessionStorage.getItem("session") || "null");
        if (!ss?.idNguoiDung) {
          setPrime(false);
          return;
        }
        setPrime(hasActiveSub(ss.idNguoiDung));
      } catch {
        setPrime(false);
      }
    };
    computePrime();

    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key === "goiTraPhiCuaNguoiDung") computePrime();
    };
    const onSubChanged = () => computePrime();

    window.addEventListener("storage", onStorage);
    window.addEventListener("subscriptionChanged", onSubChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("subscriptionChanged", onSubChanged);
    };
  }, []);

  const dsNguoiDung = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    try {
      const luu = JSON.parse(localStorage.getItem("boThe") || "[]");
      setDsBoThe(Array.isArray(luu) ? luu : []);
    } catch {
      setDsBoThe([]);
    }
  }, []);

  const denHoc = (id) => navigate(`/flashcard/${id}`);

  // Gần đây: tối đa 6 bộ thẻ mới nhất (dựa id)
  const ganDay = useMemo(() => {
    const x = [...dsBoThe];
    x.sort((a, b) => (Number(b.idBoThe) || 0) - (Number(a.idBoThe) || 0));
    return x.slice(0, 6);
  }, [dsBoThe]);

  // Phổ biến: top theo số thẻ
  const phoBien = useMemo(() => {
    const x = [...dsBoThe];
    x.sort((a, b) => (Number(b.soTu) || 0) - (Number(a.soTu) || 0));
    return x.slice(0, 8);
  }, [dsBoThe]);

  const AvatarNho = ({ url, ten }) => {
    if (url) {
      return <span className="mini-avatar" style={{ backgroundImage: `url(${url})` }} />;
    }
    const initial = (ten || "U").charAt(0).toUpperCase();
    return <span className="mini-avatar mini-avatar-fallback">{initial}</span>;
  };

  // === Nút AI cho non-prime: có ngôi sao, click → alert + điều hướng /tra-phi ===
  const AILockedButton = () => {
    const onLockedClick = () => {
      alert("Tính năng AI chỉ dành cho tài khoản trả phí. Vui lòng nâng cấp để sử dụng.");
      navigate("/tra-phi", { state: { from: "ai" } });
    };
    return (
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 1000,
        }}
      >
        <button
          onClick={onLockedClick}
          title="Nâng cấp để dùng AI"
          aria-label="Nâng cấp để dùng AI"
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            boxShadow: "0 6px 16px rgba(0,0,0,.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <FaRobot style={{ fontSize: 18, color: "#6b7280" }} />
          {/* Huy hiệu ngôi sao */}
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              fontSize: 12,
              color: "#f59e0b",
              background: "rgba(245,158,11,.12)",
              border: "1px solid rgba(245,158,11,.35)",
              padding: "2px 6px",
              borderRadius: 999,
              lineHeight: 1,
              pointerEvents: "none",
            }}
            title="Nâng cấp để mở khóa"
          >
            ★
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="home-wrap">
      {/* AI: nếu prime thì dùng AIButton; chưa prime thì hiện nút có sao, click → alert + /tra-phi */}
      {prime ? <AIButton /> : <AILockedButton />}

      {/* GẦN ĐÂY */}
      <section className="block">
        <div className="block-head">
          <h2 className="block-title">Học gần đây</h2>
        </div>

        {ganDay.length === 0 ? (
          <div className="empty">Chưa có bộ thẻ nào. Hãy tạo bộ thẻ mới!</div>
        ) : (
          <ul className="recent-list">
            {ganDay.map((item) => (
              <li
                key={item.idBoThe}
                className="recent-item"
                onClick={() => denHoc(item.idBoThe)}
              >
                <FontAwesomeIcon icon={faBook} className="icon-book" />
                <span className="recent-name">
                  {item.tenBoThe || `Bộ thẻ #${item.idBoThe}`}
                </span>
                <span className="recent-count">{item.soTu ?? 0} từ</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* BỘ THẺ PHỔ BIẾN */}
      <section className="block">
        <div className="block-head">
          <h2 className="block-title">Bộ thẻ phổ biến</h2>
        </div>

        {phoBien.length === 0 ? (
          <div className="empty">Chưa có dữ liệu để hiển thị.</div>
        ) : (
          <div className="mini-grid">
            {phoBien.map((item) => {
              const nguoiTao = dsNguoiDung.find(
                (u) => String(u.idNguoiDung) === String(item.idNguoiDung)
              );
              const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
              const anhNguoiTao = nguoiTao?.anhDaiDien || "";

              return (
                <div
                  key={item.idBoThe}
                  className="mini-card"
                  onClick={() => denHoc(item.idBoThe)}
                >
                  <div className="mini-title">{item.tenBoThe || "Không tên"}</div>
                  <div className="mini-sub">{item.soTu ?? 0} thẻ</div>

                  <div className="mini-meta">
                    <div
                      className="mini-avatar"
                      style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
                    />
                    <span className="mini-name">{tenNguoiTao}</span>
                  </div>

                  <div className="mini-actions">
                    <button
                      className="btn ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        denHoc(item.idBoThe);
                      }}
                    >
                      Học
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
