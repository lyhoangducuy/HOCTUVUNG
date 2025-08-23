import { useEffect, useMemo, useState } from "react";
import "./FeedbackTab.css";

export default function FeedbackTab({ idKhoaHoc }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [replyInputs, setReplyInputs] = useState({}); // key = idNguoiDung của feedback

  // ===== Helpers =====
  const readJSON = (k, fb) => {
    try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? fb; }
    catch { return fb; }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const fmtTime = (s) => new Date(s).toLocaleString();

  // ===== Session & data =====
  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);

  const dsNguoiDung = useMemo(() => readJSON("nguoiDung", []), []);

  const khoaHoc = useMemo(() => {
    const ds = readJSON("khoaHoc", []);
    return ds.find((k) => String(k.idKhoaHoc) === String(idKhoaHoc)) || null;
  }, [idKhoaHoc]);

  const isOwner = !!session?.idNguoiDung &&
                  String(khoaHoc?.idNguoiDung) === String(session.idNguoiDung);

  const role = useMemo(() => {
    if (!session) return null;
    const u = dsNguoiDung.find((x) => x.idNguoiDung === session.idNguoiDung);
    return u?.vaiTro || null;
  }, [session, dsNguoiDung]);

  const laThanhVien = useMemo(
    () => khoaHoc?.thanhVienIds?.includes(session?.idNguoiDung),
    [khoaHoc, session]
  );

  // ===== Load feedback =====
  useEffect(() => {
    const all = readJSON("feedback", []);
    setFeedbacks(all.filter((f) => String(f.idKhoaHoc) === String(idKhoaHoc)));
  }, [idKhoaHoc]);

  // ===== Thêm/cập nhật feedback của học viên =====
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
      // giữ replies cũ nếu đã có
      replies: [],
    };

    const all = readJSON("feedback", []);
    const idx = all.findIndex(
      (f) =>
        String(f.idKhoaHoc) === String(idKhoaHoc) &&
        String(f.idNguoiDung) === String(session.idNguoiDung)
    );

    if (idx > -1) {
      fb.replies = all[idx]?.replies || [];
      all[idx] = fb;
    } else {
      all.push(fb);
    }

    writeJSON("feedback", all);
    setFeedbacks(all.filter((f) => String(f.idKhoaHoc) === String(idKhoaHoc)));
    setRating(0);
    setComment("");
  };

  // ===== Chủ khóa học phản hồi =====
  const submitReply = (idNguoiDung) => {
    const text = (replyInputs[idNguoiDung] || "").trim();
    if (!text) return;

    const all = readJSON("feedback", []);
    const idx = all.findIndex(
      (f) =>
        String(f.idKhoaHoc) === String(idKhoaHoc) &&
        String(f.idNguoiDung) === String(idNguoiDung)
    );
    if (idx === -1) return;

    const entry = { ...(all[idx] || {}) };
    const list = Array.isArray(entry.replies) ? entry.replies : [];
    list.push({
      userId: session?.idNguoiDung,
      text,
      date: new Date().toISOString(),
    });
    entry.replies = list;
    all[idx] = entry;

    writeJSON("feedback", all);
    setFeedbacks(all.filter((f) => String(f.idKhoaHoc) === String(idKhoaHoc)));
    setReplyInputs((s) => ({ ...s, [idNguoiDung]: "" }));
  };

  return (
    <div className="fb-wrap">
      <div className="fb-head">
        <h3>Đánh giá & phản hồi</h3>
        <span className="fb-count">{feedbacks.length} đánh giá</span>
      </div>

      {/* Form học viên */}
      {role === "HOC_VIEN" && laThanhVien && (
        <form onSubmit={themFeedback} className="fb-form">
          <div className="fb-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`fb-star ${star <= rating ? "active" : ""}`}
                onClick={() => setRating(star)}
                aria-label={`Chọn ${star} sao`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            className="fb-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm nhận về khóa học..."
            rows={3}
          />

          <div className="fb-row-end">
            <button type="submit" className="fb-btn fb-primary">Gửi đánh giá</button>
          </div>
        </form>
      )}

      {/* Danh sách feedback */}
      {feedbacks.length === 0 ? (
        <p className="fb-empty">Chưa có feedback nào.</p>
      ) : (
        <ul className="fb-list">
          {feedbacks.map((fb) => {
            const user = dsNguoiDung.find((u) => u.idNguoiDung === fb.idNguoiDung);
            const name = user?.tenNguoiDung || "Ẩn danh";
            const replies = Array.isArray(fb.replies) ? fb.replies : [];

            return (
              <li key={fb.idNguoiDung} className="fb-item">
                <div className="fb-item-head">
                  <div className="fb-user">
                    <div className="fb-avatar">
                      {(name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="fb-user-name">{name}</div>
                      <div className="fb-meta">
                        <span className="fb-stars-inline">
                          {"★".repeat(fb.rating)}
                          <span className="fb-stars-dim">
                            {"★".repeat(5 - fb.rating)}
                          </span>
                        </span>
                        <span>· {fmtTime(fb.ngay)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="fb-body">{fb.comment}</div>

                {/* Replies list */}
                {replies.length > 0 && (
                  <div className="fb-replies">
                    {replies.map((r, i) => {
                      const owner = dsNguoiDung.find(
                        (u) => String(u.idNguoiDung) === String(r.userId)
                      );
                      return (
                        <div key={i} className="fb-reply">
                          <div className="fb-reply-badge">Phản hồi của giảng viên</div>
                          <div className="fb-reply-text">{r.text}</div>
                          <div className="fb-reply-time">{fmtTime(r.date)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply box for owner */}
                {isOwner && (
                  <div className="fb-reply-box">
                    <textarea
                      className="fb-input"
                      rows={2}
                      placeholder="Phản hồi lại học viên..."
                      value={replyInputs[fb.idNguoiDung] || ""}
                      onChange={(e) =>
                        setReplyInputs((s) => ({ ...s, [fb.idNguoiDung]: e.target.value }))
                      }
                    />
                    <div className="fb-row-end">
                      <button
                        type="button"
                        className="fb-btn fb-secondary"
                        onClick={() =>
                          setReplyInputs((s) => ({ ...s, [fb.idNguoiDung]: "" }))
                        }
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="fb-btn fb-primary"
                        onClick={() => submitReply(fb.idNguoiDung)}
                      >
                        Gửi phản hồi
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
