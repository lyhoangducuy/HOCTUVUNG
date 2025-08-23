import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Menu dấu ba chấm cho trang Khóa học
 * props:
 * - open: boolean
 * - anchorRef: ref tới nút "..."
 * - onClose: () => void
 * - onViewDetail: () => void
 * - onDelete: () => void
 * - isOwner: boolean (chỉ chủ khóa học mới thấy nút sửa/xoá)
 * - idKhoaHoc: string | number (id khóa học để lưu feedback & kiểm tra thành viên)
 */
export default function LopMenu({
  open,
  anchorRef,
  onClose,
  onViewDetail,
  onDelete,
  isOwner = false,
  idKhoaHoc,
}) {
  const menuRef = useRef(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // user hiện tại
  const session = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("session") || "null");
    } catch {
      return null;
    }
  }, []);

  const dsNguoiDung = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    } catch {
      return [];
    }
  }, []);

  // khóa học hiện tại
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

  // chỉ true nếu user nằm trong danh sách thành viên của khóa học
  const laThanhVien = !!khoaHoc?.thanhVienIds?.includes(session?.idNguoiDung);

  // click outside để đóng menu
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      const a = anchorRef?.current;
      const m = menuRef.current;
      if (m && !m.contains(e.target) && a && !a.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  // hàm lưu feedback
  const themFeedback = (e) => {
    e.preventDefault();
    if (!session?.idNguoiDung) return;
    if (!rating) {
      alert("Vui lòng chọn số sao!");
      return;
    }

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
    if (idx > -1) {
      all[idx] = fb; // cập nhật nếu đã có feedback trước đó
    } else {
      all.push(fb);
    }

    localStorage.setItem("feedback", JSON.stringify(all));
    alert("Đã gửi đánh giá của bạn!");
    setRating(0);
    setComment("");
    onClose?.();
  };

  return (
    <div ref={menuRef} className="ellipsis-menu">
      {isOwner && (
        <>
          <button
            className="ellipsis-item"
            onClick={() => {
              onViewDetail?.();
              onClose?.();
            }}
          >
            Xem chi tiết khóa học hoặc sửa
          </button>

          <button
            className="ellipsis-item danger"
            onClick={() => {
              onDelete?.();
              onClose?.();
            }}
          >
            Xoá khóa học
          </button>
        </>
      )}

      {!isOwner && role === "HOC_VIEN" && laThanhVien && (
        <form
          onSubmit={themFeedback}
          style={{ padding: 10, borderTop: "1px solid #eee" }}
        >
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Đánh giá khóa học</div>
          <div style={{ marginBottom: 6 }}>
            {[1, 2, 3, 4, 5].map((star) => (
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
              width: "100%",
              fontSize: 13,
              padding: 6,
              border: "1px solid #ddd",
              borderRadius: 6,
              marginBottom: 6,
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "6px 0",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Gửi
          </button>
        </form>
      )}

      {!isOwner && (!laThanhVien || role !== "HOC_VIEN") && (
        <div style={{ padding: "10px", fontSize: 14, color: "#6b7280" }}>
          Không có thao tác khả dụng
        </div>
      )}
    </div>
  );
}
