import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./BoTheDetail.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEllipsisH } from "@fortawesome/free-solid-svg-icons";

import { auth, db } from "../../../../lib/firebase";
import {
  doc,
  getDoc,
  getDocFromCache,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
  deleteDoc,
} from "firebase/firestore";


import { formatDateVN } from "./utils/format";
import BangTuVung from "../../../components/HocBoThe/BangTuVung";
import TieuDeBoThe from "../../../components/HocBoThe/TieuDeBoThe";
import TopBar from "../../../components/HocBoThe/TopBar";
import MetaThongTin from "../../../components/HocBoThe/MetaThongTin";

export default function BoTheDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ====== STATE (hook ở file chính) ======
  const [card, setCard] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAllTerms, setShowAllTerms] = useState(false);

  // UI: menu “…” (đặt state ở file chính luôn)
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

  // uid hiện tại (giữ qua session để F5 không chậm)
  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);
  const currentUid = auth.currentUser?.uid || session?.idNguoiDung || null;

  const isOwner = useMemo(() => {
    if (!currentUid || !card?.idNguoiDung) return false;
    return String(currentUid) === String(card.idNguoiDung);
  }, [currentUid, card?.idNguoiDung]);

  // ===== TẢI NHANH: sessionStorage -> Firestore cache -> Server =====
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const cardKey = `boThe_cache_${id}`;

    (async () => {
      setLoading(true);
      setNotFound(false);

      // 1) sessionStorage cache (hiển thị tức thời nếu có)
      try {
        const cached = JSON.parse(sessionStorage.getItem(cardKey) || "null");
        if (cached?.card && !cancelled) {
          setCard(cached.card);
          if (cached.creator) setCreator(cached.creator);
          setLoading(false);
        }
      } catch {}

      // 2) Firestore local cache (nếu có)
      try {
        const snapCache = await getDocFromCache(doc(db, "boThe", String(id)));
        if (snapCache.exists() && !cancelled) {
          const data = snapCache.data();
          if (!card) setCard(data);
          setLoading(false);
        }
      } catch {}

      // 3) Server fetch (nguồn chuẩn)
      try {
        const snap = await getDoc(doc(db, "boThe", String(id)));
        if (!snap.exists()) {
          if (!cancelled) { setNotFound(true); setLoading(false); }
          return;
        }

        const data = snap.data();
        if (cancelled) return;

        setCard(data);
        setLoading(false);

        // tác giả: lấy từ cache nếu có, không thì fetch
        let creatorData = null;
        if (data?.idNguoiDung) {
          const ck = `user_cache_${data.idNguoiDung}`;
          try {
            const cachedU = JSON.parse(sessionStorage.getItem(ck) || "null");
            if (cachedU) creatorData = cachedU;
          } catch {}

          if (!creatorData) {
            try {
              const uSnap = await getDoc(doc(db, "nguoiDung", String(data.idNguoiDung)));
              if (uSnap.exists()) creatorData = uSnap.data();
            } catch {}
          }
          if (!cancelled) setCreator(creatorData);
          if (creatorData) sessionStorage.setItem(ck, JSON.stringify(creatorData));
        }

        // lưu cache thẻ
        sessionStorage.setItem(cardKey, JSON.stringify({ card: data, creator: creatorData, ts: Date.now() }));
      } catch {
        if (!cancelled) { setNotFound(true); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [id]); // giữ hook ở đây

  const blocked = card?.cheDo === "ca_nhan" && !isOwner;

  // ===== Handlers (ở file chính) =====
  const goBack = () => navigate(-1);

  const goLearn = async () => {
    if (!currentUid) { navigate("/dang-nhap"); return; }
    const idBoTheValue = Number.isFinite(Number(id)) ? Number(id) : String(id);
    const idTDH = `${currentUid}_${idBoTheValue}`;

    try {
      await setDoc(
        doc(db, "tienDoHoc", idTDH),
        { idTDH, idBoThe: idBoTheValue, idNguoiDung: String(currentUid), ngayHocGanDay: serverTimestamp() },
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

  const handleEdit = () => { if (isOwner) navigate(`/suabothe/${id}`); };

  const handleDelete = async () => {
    if (!isOwner || !card) return;
    const ok = window.confirm(`Xoá bộ thẻ "${card.tenBoThe || card.idBoThe}"? Hành động này không thể hoàn tác.`);
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

  // ====== UI states ======
  if (loading) {
    return (
      <div className="bt-wrap">
        <div className="bt-card">
          {/* skeleton */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="skeleton skeleton-btn" style={{ width: 88, height: 32 }} />
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
          </div>
          <div className="skeleton" style={{ width: "60%", height: 24, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: "40%", height: 16, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: "100%", height: 120 }} />
        </div>
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className="bt-wrap">
        <div className="bt-card">
          <div className="back" onClick={goBack} style={{ marginBottom: 12 }}>
            <FontAwesomeIcon icon={faArrowLeft} className="iconback" /> Quay lại
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
          <div className="back" onClick={goBack} style={{ marginBottom: 12 }}>
            <FontAwesomeIcon icon={faArrowLeft} className="iconback" /> Quay lại
          </div>
        <h2>Bộ thẻ ở chế độ <em>cá nhân</em></h2>
          <p>Bạn không có quyền xem bộ thẻ này.</p>
        </div>
      </div>
    );
  }

  const { tenBoThe, soTu, idBoThe, cheDo, luotHoc = 0, ngayTao, ngayChinhSua, danhSachThe = [] } = card;

  return (
    <div className="bt-card">
      {/* Top bar: nút quay lại + menu (state ở file chính) */}
      <TopBar
        onBack={goBack}
        isOwner={isOwner}
        openMenu={openMenu}
        onToggleMenu={() => setOpenMenu((v) => !v)}
        menuBtnRef={menuBtnRef}
        menuRef={menuRef}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Tiêu đề + meta gọn */}
      <TieuDeBoThe
        tenBoThe={tenBoThe}
        idBoThe={idBoThe}
        cheDo={cheDo}
        soThe={typeof soTu === "number" ? soTu : danhSachThe.length}
        luotHoc={luotHoc}
      />

      {/* Grid thông tin cơ bản */}
      <MetaThongTin
        idBoThe={idBoThe}
        creatorName={creator?.tenNguoiDung || creator?.gmail || creator?.email || "Ẩn danh"}
        ngayTao={formatDateVN(ngayTao)}
        ngayChinhSua={formatDateVN(ngayChinhSua)}
      />

      {/* Bảng từ vựng (10 mục đầu, bấm để mở rộng) */}
      <BangTuVung
        danhSachThe={danhSachThe}
        showAll={showAllTerms}
        onToggle={() => setShowAllTerms((v) => !v)}
      />

      {/* Nút học ngay */}
      <div className="bt-foot center">
        <button className="btn primary" onClick={goLearn}>Học ngay</button>
      </div>
    </div>
  );
}
