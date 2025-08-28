// src/pages/Home/chucNang/ThuVienLop.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ThuVienLop.css";

import ItemBo from "../../../../components/BoThe/itemBo"; // <-- CHỈNH LẠI NẾU ĐƯỜNG DẪN KHÁC

import { auth, db } from "../../../../../lib/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";

export default function ThuVienLop({ khoaHoc, onCapNhat }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [boTheHienThi, setBoTheHienThi] = useState([]);

  // uid hiện tại (fallback session để tương thích phần cũ)
  const session = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("session") || "null");
    } catch {
      return null;
    }
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

        // Lấy boThe/{id} theo từng id (KHÔNG lọc cheDo để bộ thẻ trong lớp luôn hiện)
        const boTheDocs = await Promise.all(
          boTheIds.map((id) => getDoc(doc(db, "boThe", String(id))))
        );

        const rawBoThe = boTheDocs
          .filter((snap) => snap.exists())
          .map((snap) => {
            const data = snap.data() || {};
            return {
              ...data,
              idBoThe: data.idBoThe ?? snap.id,
              // giữ lại cheDo nếu cần hiển thị đâu đó, NHƯNG KHÔNG dùng để ẩn trong lớp
              cheDo: data.cheDo || "cong_khai",
            };
          });

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
            _tenNguoiTao: creator.tenNguoiDung || creator.hoten || creator.email || "Ẩn danh",
            _anhNguoiTao: creator.anhDaiDien || "",
            soTu:
              typeof bt.soTu === "number"
                ? bt.soTu
                : Array.isArray(bt.danhSachThe)
                ? bt.danhSachThe.length
                : 0,
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
    // stringify để trigger khi mảng đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(boTheIds)]);

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
      // Cập nhật lạc quan
      setBoTheHienThi((prev) =>
        prev.filter((x) => String(x.idBoThe) !== String(bt.idBoThe))
      );
      onCapNhat &&
        onCapNhat({
          ...khoaHoc,
          boTheIds: (khoaHoc.boTheIds || []).filter(
            (x) => String(x) !== String(bt.idBoThe)
          ),
        });
    } catch (e) {
      console.error(e);
      alert("Không thể gỡ bộ thẻ. Vui lòng thử lại.");
    }
  };

  if (loading) return <div className="tvl-empty">Đang tải...</div>;
  if (boTheHienThi.length === 0)
    return <div className="tvl-empty">Chưa có bộ thẻ nào. Bấm “+ → Thêm bộ thẻ”.</div>;

  return (
    <div className="tvl-grid">
      {boTheHienThi.map((bt) => (
        <ItemBo
          key={bt.idBoThe}
          item={bt}
          author={{ tenNguoiDung: bt._tenNguoiTao, anhDaiDien: bt._anhNguoiTao }}
          onClick={xemBoThe}
          onLearn={xemBoThe}
          inCourse={true} // để hiện nhóm nút học + (có thể) gỡ
          onRemoveFromCourse={
            isOwner ? () => goBoTheKhoiKhoaHoc(bt) : undefined
          }
        />
      ))}
    </div>
  );
}
