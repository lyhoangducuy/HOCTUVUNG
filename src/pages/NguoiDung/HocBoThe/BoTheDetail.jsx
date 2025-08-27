// src/pages/BoThe/BoTheDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./BoTheDetail.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEllipsisH } from "@fortawesome/free-solid-svg-icons";

import { auth, db } from "../../../../lib/firebase";
import {
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  deleteDoc,
} from "firebase/firestore";

export default function BoTheDetail() {
  const { id } = useParams(); // idBoThe (docId = String(idBoThe))
  const navigate = useNavigate();

  const [card, setCard] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAllTerms, setShowAllTerms] = useState(false);

  // menu "..."
  const [openMenu, setOpenMenu] = useState(false);
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);

  // đóng menu khi click ra ngoài
  useEffect(() => {
    if (!openMenu) return;
    function handleOutside(e) {
      const btn = menuBtnRef.current;
      const menu = menuRef.current;
      if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openMenu]);

  const session = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("session") || "null");
    } catch {
      return null;
    }
  }, []);
  const currentUid = auth.currentUser?.uid || session?.idNguoiDung || null;

  const isOwner = useMemo(() => {
    if (!currentUid || !card?.idNguoiDung) return false;
    return String(currentUid) === String(card.idNguoiDung);
  }, [currentUid, card?.idNguoiDung]);

  const formatDate = (v) => {
    if (!v) return "";
    const d =
      typeof v?.toDate === "function" ? v.toDate() : v instanceof Date ? v : new Date(v);
    return Number.isNaN(d?.getTime?.()) ? "" : d.toLocaleString("vi-VN");
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "boThe", String(id)),
      async (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = snap.data();
        setCard(data);
        setLoading(false);

        try {
          if (data?.idNguoiDung) {
            const u = await getDoc(doc(db, "nguoiDung", String(data.idNguoiDung)));
            setCreator(u.exists() ? u.data() : null);
          } else {
            setCreator(null);
          }
        } catch {
          setCreator(null);
        }
      },
      () => {
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  const blocked = card?.cheDo === "ca_nhan" && !isOwner;

  const goLearn = async () => {
    if (!currentUid) {
      navigate("/dang-nhap");
      return;
    }
    const idBoTheValue = Number.isFinite(Number(id)) ? Number(id) : String(id);
    const idTDH = `${currentUid}_${idBoTheValue}`;

    try {
      await setDoc(
        doc(db, "tienDoHoc", idTDH),
        {
          idTDH,
          idBoThe: idBoTheValue,
          idNguoiDung: String(currentUid),
          ngayHocGanDay: serverTimestamp(),
        },
        { merge: true }
      );

      await updateDoc(doc(db, "boThe", String(id)), {
        luotHoc: increment(1),
        ngayChinhSua: serverTimestamp(),
      });

      window.dispatchEvent(new Event("tienDoHocUpdated"));
    } catch (e) {
      console.error("Cập nhật tiến độ/luotHoc thất bại:", e);
    }

    navigate(`/flashcard/${id}`);
  };

  const handleEdit = () => {
    if (!isOwner) return;
    navigate(`/suabothe/${id}`);
  };

  const handleDelete = async () => {
    if (!isOwner || !card) return;
    const ok = window.confirm(
      `Xoá bộ thẻ "${card.tenBoThe || card.idBoThe}"? Hành động này không thể hoàn tác.`
    );
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "boThe", String(id)));
      alert("Đã xoá bộ thẻ.");
      navigate("/giangvien");
    } catch (e) {
      console.error(e);
      alert("Không thể xoá bộ thẻ. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="bt-wrap">
        <div className="bt-card">Đang tải bộ thẻ...</div>
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className="bt-wrap">
        <div className="bt-card">
          <div
            className="back"
            onClick={() => navigate(-1)}
            style={{ marginBottom: 12 }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
            Quay lại
          </div>
          <h2>Không tìm thấy bộ thẻ</h2>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="bt-wrap">
        <div className="bt-card">
          <div
            className="back"
            onClick={() => navigate(-1)}
            style={{ marginBottom: 12 }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
            Quay lại
          </div>
          <h2>
            Bộ thẻ ở chế độ <em>cá nhân</em>
          </h2>
          <p>Bạn không có quyền xem bộ thẻ này.</p>
        </div>
      </div>
    );
  }

  const {
    tenBoThe,
    soTu,
    idBoThe,
    idNguoiDung,
    danhSachThe = [],
    cheDo,
    luotHoc = 0,
    ngayTao,
    ngayChinhSua,
  } = card;

  const termsToShow = showAllTerms ? danhSachThe : danhSachThe.slice(0, 10);

  return (
    <>
      <div className="bt-card">
        {/* Hàng trên cùng: Quay lại + menu “…” (chỉ chủ sở hữu) */}
        <div
          className="bt-top-row"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
        >
          <div className="back" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
            Quay lại
          </div>

          {isOwner && (
            <div className="more-wrapper" style={{ position: "relative" }}>
              <button
                ref={menuBtnRef}
                className="more-btn"
                onClick={() => setOpenMenu((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={openMenu}
                title="Tùy chọn"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid var(--line,#e5e7eb)",
                  background: "white",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <FontAwesomeIcon icon={faEllipsisH} />
              </button>

              {openMenu && (
                <div
                  ref={menuRef}
                  className="more-menu"
                  style={{
                    position: "absolute",
                    top: 44,
                    right: 0,
                    background: "white",
                    border: "1px solid var(--line,#e5e7eb)",
                    borderRadius: 10,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                    minWidth: 160,
                    zIndex: 20,
                    overflow: "hidden",
                  }}
                >
                  <button
                    className="more-item"
                    onClick={handleEdit}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      background: "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Sửa bộ thẻ
                  </button>
                  <button
                    className="more-item danger"
                    onClick={handleDelete}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      background: "white",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                    }}
                  >
                    Xoá bộ thẻ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tiêu đề + meta */}
        <div className="bt-head-only">
          <h2 className="bt-title">{tenBoThe || `Bộ thẻ #${idBoThe}`}</h2>
          <div className="bt-sub">
            <span className={`chip ${cheDo === "cong_khai" ? "pub" : "pri"}`}>
              {cheDo === "cong_khai" ? "Công khai" : "Cá nhân"}
            </span>
            <span className="sep">•</span>
            <span>{soTu ?? danhSachThe.length} thẻ</span>
            <span className="sep">•</span>
            <span>{luotHoc} lượt học</span>
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <div className="bt-grid">
          <div className="bt-row">
            <span className="bt-label">Mã bộ thẻ</span>
            <span>{idBoThe}</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Người tạo</span>
            <span>{creator?.tenNguoiDung || creator?.gmail || creator?.email || "Ẩn danh"}</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Ngày tạo</span>
            <span>{formatDate(ngayTao)}</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Chỉnh sửa</span>
            <span>{formatDate(ngayChinhSua)}</span>
          </div>
        </div>

        {/* Danh sách thẻ */}
        <div className="bt-list">
          <div className="bt-list-head">
            <h3>Từ vựng</h3>
            {danhSachThe.length > 10 && (
              <button className="btn xs" onClick={() => setShowAllTerms((v) => !v)}>
                {showAllTerms ? "Thu gọn" : `Xem tất cả (${danhSachThe.length})`}
              </button>
            )}
          </div>

          {danhSachThe.length === 0 ? (
            <div className="empty">Bộ thẻ chưa có mục nào.</div>
          ) : (
            <div className="table">
              <div className="tr head">
                <div className="td idx">#</div>
                <div className="td">Từ</div>
                <div className="td">Nghĩa</div>
              </div>
              {termsToShow.map((t, i) => (
                <div className="tr" key={`${i}-${t?.tu}-${t?.nghia}`}>
                  <div className="td idx">{i + 1}</div>
                  <div className="td">{t?.tu}</div>
                  <div className="td">{t?.nghia}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nút học ngay */}
        <div className="bt-foot center">
          <button className="btn primary" onClick={goLearn}>
            Học ngay
          </button>
        </div>
      </div>
    </>
  );
}
