import { useEffect, useMemo, useState } from "react";

export default function FeedbackTab({ idLop }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

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

  const lop = useMemo(() => {
    try {
      const ds = JSON.parse(localStorage.getItem("lop") || "[]");
      return ds.find((l) => String(l.idLop) === String(idLop)) || null;
    } catch {
      return null;
    }
  }, [idLop]);

  const role = useMemo(() => {
    if (!session) return null;
    const u = dsNguoiDung.find((x) => x.idNguoiDung === session.idNguoiDung);
    return u?.vaiTro || null;
  }, [session, dsNguoiDung]);

  // check có phải thành viên không
  const laThanhVien = useMemo(() => {
    return lop?.thanhVienIds?.includes(session?.idNguoiDung);
  }, [lop, session]);

  // load feedback
  useEffect(() => {
    const all = JSON.parse(localStorage.getItem("feedback") || "[]");
    setFeedbacks(all.filter((f) => String(f.idLop) === String(idLop)));
  }, [idLop]);

  const themFeedback = (e) => {
    e.preventDefault();
    if (!session?.idNguoiDung) return;
    if (!rating) {
      alert("Vui lòng chọn số sao!");
      return;
    }

    const fb = {
      idLop,
      idNguoiDung: session.idNguoiDung,
      rating,
      comment,
      ngay: new Date().toISOString(),
    };

    const all = JSON.parse(localStorage.getItem("feedback") || "[]");

    // tránh cho 1 user đánh giá nhiều lần: ghi đè nếu đã có
    const idx = all.findIndex(
      (f) =>
        String(f.idLop) === String(idLop) &&
        String(f.idNguoiDung) === String(session.idNguoiDung)
    );
    if (idx > -1) {
      all[idx] = fb;
    } else {
      all.push(fb);
    }

    localStorage.setItem("feedback", JSON.stringify(all));

    setFeedbacks(all.filter((f) => String(f.idLop) === String(idLop)));
    setRating(0);
    setComment("");
  };

  return (
    <div className="tab-content">
      <h3>Feedback ({feedbacks.length})</h3>

      {/* Chỉ HOC_VIEN và là thành viên lớp mới có form feedback */}
      {role === "HOC_VIEN" && laThanhVien && (
        <form onSubmit={themFeedback} style={{ margin: "12px 0" }}>
          <div style={{ marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                style={{
                  fontSize: 22,
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
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nhập bình luận..."
            rows={3}
            style={{ width: "100%", padding: 8 }}
          />

          <button type="submit" className="btn ghost" style={{ marginTop: 8 }}>
            Gửi feedback
          </button>
        </form>
      )}

      {/* Danh sách feedback */}
      {feedbacks.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Chưa có feedback nào.</p>
      ) : (
        <ul style={{ marginTop: 12 }}>
          {feedbacks.map((fb, idx) => {
            const user = dsNguoiDung.find(
              (u) => u.idNguoiDung === fb.idNguoiDung
            );
            return (
              <li
                key={idx}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px 0",
                }}
              >
                <strong>{user?.tenNguoiDung || "Ẩn danh"}</strong> – {fb.rating}⭐
                <p style={{ margin: "4px 0" }}>{fb.comment}</p>
                <small style={{ opacity: 0.6 }}>
                  {new Date(fb.ngay).toLocaleString()}
                </small>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
