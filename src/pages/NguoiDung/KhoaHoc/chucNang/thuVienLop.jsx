import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ThuVienLop.css";

import { auth, db } from "../../../../../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";

export default function ThuVienLop({ khoaHoc, onCapNhat }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [boTheHienThi, setBoTheHienThi] = useState([]);

  // uid hiện tại (fallback session để tương thích phần cũ)
  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);
  const uid = auth.currentUser?.uid || session?.idNguoiDung || null;

  if (!khoaHoc) return <div className="tvl-empty">Không tìm thấy khóa học.</div>;

  const isOwner = !!uid && String(uid) === String(khoaHoc.idNguoiDung);

  const boTheIds = Array.isArray(khoaHoc.boTheIds) ? khoaHoc.boTheIds : [];

  // Nạp bộ thẻ + tác giả từ Firestore
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        if (!boTheIds.length) {
          if (!cancelled) setBoTheHienThi([]);
          return;
        }

        // Lấy boThe/{id} theo từng id
        const boTheDocs = await Promise.all(
          boTheIds.map((id) => getDoc(doc(db, "boThe", String(id))))
        );
        const rawBoThe = boTheDocs
          .filter((snap) => snap.exists())
          .map((snap) => snap.data());

        // Thu thập idNguoiDung duy nhất để lấy thông tin tác giả
        const ownerIds = [
          ...new Set(
            rawBoThe
              .map((b) => (b?.idNguoiDung != null ? String(b.idNguoiDung) : null))
              .filter(Boolean)
          ),
        ];

        const ownerDocs = await Promise.all(
          ownerIds.map((oid) => getDoc(doc(db, "nguoiDung", String(oid))))
        );
        const userMap = {};
        ownerDocs.forEach((s) => {
          if (s.exists()) userMap[s.id] = s.data();
        });

        const merged = rawBoThe.map((bt) => {
          const creator = userMap[String(bt.idNguoiDung)] || {};
          return {
            ...bt,
            _tenNguoiTao: creator.tenNguoiDung || "Ẩn danh",
            _anhNguoiTao: creator.anhDaiDien || "",
            soTu: bt.soTu ?? (Array.isArray(bt.danhSachThe) ? bt.danhSachThe.length : 0),
          };
        });

        if (!cancelled) setBoTheHienThi(merged);
      } catch {
        if (!cancelled) setBoTheHienThi([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [db, JSON.stringify(boTheIds)]); // stringify để trigger khi mảng đổi

  const xemBoThe = (id) => navigate(`/flashcard/${id}`);

  // ✅ Chỉ chủ khóa học mới gỡ được
  const goBoTheKhoiKhoaHoc = async (bt) => {
    if (!isOwner) return;
    const ten = bt.tenBoThe || `Bộ thẻ #${bt.idBoThe}`;
    const ok = window.confirm(`Gỡ "${ten}" khỏi khóa học?`);
    if (!ok) return;

    try {
      await updateDoc(doc(db, "khoaHoc", String(khoaHoc.idKhoaHoc)), {
        boTheIds: arrayRemove(String(bt.idBoThe)),
      });
      // UI sẽ tự cập nhật khi parent Lop.jsx onSnapshot thay đổi.
      // Nếu muốn cập nhật lạc quan ngay:
      setBoTheHienThi((prev) => prev.filter((x) => String(x.idBoThe) !== String(bt.idBoThe)));
      onCapNhat && onCapNhat({ ...khoaHoc, boTheIds: khoaHoc.boTheIds.filter((x) => String(x) !== String(bt.idBoThe)) });
    } catch (e) {
      console.error(e);
      alert("Không thể gỡ bộ thẻ. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return <div className="tvl-empty">Đang tải...</div>;
  }

  if (boTheHienThi.length === 0) {
    return <div className="tvl-empty">Chưa có bộ thẻ nào. Bấm “+ → Thêm bộ thẻ”.</div>;
  }

  return (
    <div className="tvl-grid">
      {boTheHienThi.map((bt) => (
        <div key={bt.idBoThe} className="tvl-card" onClick={() => xemBoThe(bt.idBoThe)}>
          <div className="tvl-title">{bt.tenBoThe || `Bộ thẻ #${bt.idBoThe}`}</div>
          <div className="tvl-sub">{bt.soTu} từ</div>

          <div className="tvl-meta" onClick={(e) => e.stopPropagation()}>
            {bt._anhNguoiTao ? (
              <img className="tvl-avatar" src={bt._anhNguoiTao} alt="" />
            ) : (
              <div className="tvl-avatar tvl-avatar--placeholder">
                {(bt._tenNguoiTao || "?")[0]?.toUpperCase() || "?"}
              </div>
            )}
            <span className="tvl-name">{bt._tenNguoiTao}</span>
          </div>

          <div className="tvl-actions" onClick={(e) => e.stopPropagation()}>
            <button className="tvl-btn tvl-btn--ghost" onClick={() => xemBoThe(bt.idBoThe)}>
              Học
            </button>
            {isOwner && (
              <button
                className="tvl-btn tvl-btn--danger"
                onClick={() => goBoTheKhoiKhoaHoc(bt)}
              >
                Gỡ khỏi khóa học
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
