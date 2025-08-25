import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Menu dấu ba chấm cho trang Khóa học
 * Props:
 * - open: boolean
 * - anchorRef: ref tới nút "..."
 * - onClose: () => void
 * - onViewDetail: () => void
 * - onDelete: () => void
 * - isOwner: boolean (chỉ chủ khóa học mới thấy sửa/xóa)
 * - idKhoaHoc: string|number
 * - canLeave: boolean (thành viên không phải chủ -> có thể rời lớp)
 * - onLeft: () => void (callback sau khi rời lớp để reload UI)
 */
export default function LopMenu({
  open,
  anchorRef,
  onClose,
  onViewDetail,
  onDelete,
  isOwner = false,
  idKhoaHoc,
  canLeave = false,
  onLeft,
}) {
  const menuRef = useRef(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);

  const dsNguoiDung = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("nguoiDung") || "[]"); }
    catch { return []; }
  }, []);

  // lấy khóa học hiện tại để biết user có phải thành viên không (cho form đánh giá)
  const khoaHoc = useMemo(() => {
    try {
      const ds = JSON.parse(localStorage.getItem("khoaHoc") || "[]");
      return ds.find((l) => String(l.idKhoaHoc) === String(idKhoaHoc)) || null;
    } catch {
      return null;
    }
  }, [idKhoaHoc]);

  const role = useMemo(() => {
    if (!session) return null;
    const u = dsNguoiDung.find((x) => x.idNguoiDung === session.idNguoiDung);
    return u?.vaiTro || null;
  }, [session, dsNguoiDung]);

  const laThanhVien = !!khoaHoc?.thanhVienIds?.includes(session?.idNguoiDung);

  // click ra ngoài để đóng
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      const a = anchorRef?.current;
      const m = menuRef.current;
      if (m && !m.contains(e.target) && a && !a.contains(e.target)) onClose?.();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  const themFeedback = (e) => {
    e.preventDefault();
    if (!session?.idNguoiDung) return;
    if (!rating) { alert("Vui lòng chọn số sao!"); return; }

    const fb = {
      idKhoaHoc,
      idNguoiDung: session.idNguoiDung,
      rating,
      comment: (comment || "").trim(),
      ngay: new Date().toISOString(),
    };

    const all = JSON.parse(localStorage.getItem("feedback") || "[]");
    const idx = all.findIndex(
      (f) =>
        String(f.idKhoaHoc) === String(idKhoaHoc) &&
        String(f.idNguoiDung) === String(session.idNguoiDung)
    );
    if (idx > -1) all[idx] = fb; else all.push(fb);

    localStorage.setItem("feedback", JSON.stringify(all));
    alert("Đã gửi đánh giá của bạn!");
    setRating(0); setComment("");
    onClose?.();
  };

  const roiLop = () => {
    if (!session?.idNguoiDung || !idKhoaHoc) return;
    if (!window.confirm("Bạn chắc chắn muốn rời khóa học này?")) return;

    const ds = JSON.parse(localStorage.getItem("khoaHoc") || "[]");
    const i = ds.findIndex((k) => String(k.idKhoaHoc) === String(idKhoaHoc));
    if (i === -1) return;

    const kh = { ...ds[i] };
    // loại khỏi thành viên (và cả danh sách chờ nếu có)
    kh.thanhVienIds = (kh.thanhVienIds || []).filter(
      (x) => String(x) !== String(session.idNguoiDung)
    );
    kh.yeuCauThamGiaIds = (kh.yeuCauThamGiaIds || []).filter(
      (x) => String(x) !== String(session.idNguoiDung)
    );

    ds[i] = kh;
    localStorage.setItem("khoaHoc", JSON.stringify(ds));

    // bắn event cho các nơi khác đọc lại
    window.dispatchEvent(new Event("khoaHocChanged"));

    onLeft?.();   // cho parent reload ngay
    onClose?.();  // đóng menu
  };

  return (
    <div ref={menuRef} className="ellipsis-menu">
      {isOwner && (
        <>
          <button
            className="ellipsis-item"
            onClick={() => { onViewDetail?.(); onClose?.(); }}
          >
            Xem chi tiết khóa học / Sửa
          </button>
          <button
            className="ellipsis-item danger"
            onClick={() => { onDelete?.(); onClose?.(); }}
          >
            Xóa khóa học
          </button>
        </>
      )}

      {!isOwner && canLeave && (
        <button className="ellipsis-item danger" onClick={roiLop}>
          Rời khóa học
        </button>
      )}

      {/* Form đánh giá: chỉ học viên + là thành viên */}
      {!isOwner && role === "HOC_VIEN" && laThanhVien && (
        <form onSubmit={themFeedback} style={{ padding: 10, borderTop: "1px solid #eee" }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Đánh giá khóa học</div>
          <div style={{ marginBottom: 6 }}>
            {[1,2,3,4,5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                style={{
                  fontSize: 20,
                  cursor: "pointer",
                  color: star <= rating ? "gold" : "#ccc",
                  marginRight: 4,
                }}
              >
                ★
              </span>
            ))}
          </div>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Bình luận..."
            style={{
              width: "100%", fontSize: 13, padding: 6,
              border: "1px solid #ddd", borderRadius: 6, marginBottom: 6,
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%", padding: "6px 0",
              background: "#2563eb", color: "#fff",
              border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer",
            }}
          >
            Gửi
          </button>
        </form>
      )}
    </div>
  );
}
