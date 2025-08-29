// src/components/ChatAI/CreateDeckAI.jsx
import React, { useMemo, useState } from "react";
import { fetchVocabulary } from "../../ChatAI/ChatBot"; // giữ nguyên source của bạn

// Firebase
import { db } from "../../../../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const LANGS = [
  { code: "vi", label: "Tiếng Việt (vi)" },
  { code: "en", label: "English (en)" },
  { code: "ja", label: "日本語 (ja)" },
  { code: "ko", label: "한국어 (ko)" },
  { code: "zh", label: "中文 (zh)" },
  { code: "fr", label: "Français (fr)" },
  { code: "de", label: "Deutsch (de)" },
  { code: "es", label: "Español (es)" },
];
const labelOf = (code) => LANGS.find((l) => l.code === code)?.label || code;

// helper: idBoThe 6 số không trùng
async function genUniqueIdBoThe() {
  for (let i = 0; i < 5; i++) {
    const id = Math.floor(100000 + Math.random() * 900000);
    const q = query(collection(db, "boThe"), where("idBoThe", "==", id));
    const snap = await getDocs(q);
    if (snap.empty) return id;
  }
  return Number(String(Date.now()).slice(-6)); // fallback
}

export default function TaoBoTheAI({ open, onClose, user, onBusyChange }) {
  if (!open) return null;

  // form
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(1);
  const [langSrc, setLangSrc] = useState("vi");
  const [langDst, setLangDst] = useState("en");
  const [cheDo, setCheDo] = useState("ca_nhan"); // "cong_khai" | "ca_nhan"
  const [error, setError] = useState("");

  // preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTopic, setPreviewTopic] = useState("");
  const [previewList, setPreviewList] = useState([]); // [{tu, nghia}]

  // ✅ Lấy đúng userId để lưu (ưu tiên UID, fallback idNguoiDung)
  const userId = useMemo(() => {
    if (!user) return null;
    return user.uid || user.idNguoiDung || user.id || null;
  }, [user]);

  const canSubmit = useMemo(() => {
    if (!topic.trim()) return false;
    if (!count || Number(count) <= 0) return false;
    if (langSrc === langDst) return false;
    return true;
  }, [topic, count, langSrc, langDst]);

  const handleSubmitCreate = async (e) => {
    e.preventDefault();

    const num = Number(count);
    if (!Number.isInteger(num) || num <= 0) {
      setError("Số lượng phải là số nguyên dương.");
      return;
    }
    if (num > 9) {
      setError("Số lượng tối đa là 9.");
      return;
    }
    if (langSrc === langDst) {
      setError("Vui lòng chọn 2 ngôn ngữ khác nhau (gốc & muốn học).");
      return;
    }

    setError("");
    onBusyChange?.(true);
    try {
      const ds = await fetchVocabulary(topic, num, langSrc, langDst);
      setPreviewTopic(topic);
      setPreviewList((Array.isArray(ds) ? ds : []).slice(0, num));
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      alert("Không thể tạo bộ thẻ. Vui lòng thử lại.");
    } finally {
      onBusyChange?.(false);
    }
  };

  const updatePreviewItem = (idx, field, value) => {
    setPreviewList((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removePreviewItem = (idx) => {
    setPreviewList((prev) => prev.filter((_, i) => i !== idx));
  };

  const onCancelPreview = () => setPreviewOpen(false);

  // ✅ SỬA: dùng userId (UID) để pass security rules khi lưu
  const onSavePreview = async () => {
    // lọc thẻ hợp lệ
    const valid = previewList
      .map((t) => ({
        tu: String(t?.tu || "").trim(),
        nghia: String(t?.nghia || "").trim(),
      }))
      .filter((t) => t.tu && t.nghia);

    if (!valid.length) return alert("Danh sách thẻ trống hoặc không hợp lệ.");

    try {
      const idBoThe = await genUniqueIdBoThe();

      await setDoc(
        doc(db, "boThe", String(idBoThe)),
        {
          idBoThe,
          tenBoThe: String(previewTopic || "").trim() || `Bộ thẻ ${idBoThe}`,
          soTu: valid.length,

          // quan trọng: lưu owner theo UID để khớp security rules
          idNguoiDung: userId ? String(userId) : null,
          ownerUid: user?.uid ? String(user.uid) : (userId ? String(userId) : null),

          danhSachThe: valid,
          luotHoc: 0,
          cheDo, // "cong_khai" | "ca_nhan"
          ngayTao: serverTimestamp(),
          ngayChinhSua: serverTimestamp(),
        },
        { merge: true }
      );

      window.dispatchEvent(new Event("boTheUpdated"));
      setPreviewOpen(false);
      onClose?.();
      alert("Đã lưu bộ thẻ: " + (previewTopic || `#${idBoThe}`));
    } catch (e) {
      console.error("Lưu bộ thẻ thất bại:", e);
      alert("Không thể lưu bộ thẻ. Có thể do chưa đăng nhập hoặc thiếu quyền Firestore.");
    }
  };

  return (
    <>
      {/* Modal tạo nhanh */}
      <div className="create-form-modal">
        <div className="create-form-modal-content">
          <div className="create-form-modal-content-header">
            <h3>Tạo bộ thẻ</h3>
            <button onClick={onClose} aria-label="Đóng">X</button>
          </div>

          <form onSubmit={handleSubmitCreate}>
            <div className="create-form-modal-content-form">
              <label className="create-form-modal-content-form-label">
                <span>Chủ đề</span>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Nhập chủ đề bộ thẻ"
                />
              </label>

              {/* Ngôn ngữ */}
              <label className="create-form-modal-content-form-label">
                <span>Ngôn ngữ gốc</span>
                <select value={langSrc} onChange={(e) => setLangSrc(e.target.value)}>
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </label>

              <label className="create-form-modal-content-form-label">
                <span>Ngôn ngữ muốn học</span>
                <select value={langDst} onChange={(e) => setLangDst(e.target.value)}>
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </label>

              {/* Chế độ lưu */}
              <label className="create-form-modal-content-form-label">
                <span>Chế độ</span>
                <select value={cheDo} onChange={(e) => setCheDo(e.target.value)}>
                  <option value="cong_khai">Công khai — ai cũng tìm & học được</option>
                  <option value="ca_nhan">Cá nhân — chỉ mình tôi thấy</option>
                </select>
              </label>

              <label>
                <span>Số lượng (tối đa 9)</span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={count}
                  onChange={(e) => {
                    const v = e.target.value === "" ? "" : Math.max(1, Math.min(9, Number(e.target.value)));
                    setCount(v);
                  }}
                  placeholder="1 - 9"
                />
              </label>

              {error && <div style={{ color: "#d33", fontSize: 14 }}>{error}</div>}

              <div className="create-form-modal-content-form-button">
                <button type="button" onClick={onClose}>Hủy</button>
                <button type="submit" disabled={!canSubmit}>Tạo</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal preview */}
      {previewOpen && (
        <div className="preview-modal">
          <div className="preview-modal-content">
            <div className="preview-modal-header">
              <h1 className="preview-modal-header-title">Xem lại bộ thẻ: {previewTopic}</h1>
              <button onClick={onCancelPreview}>X</button>
            </div>

            <div className="preview-modal-body">
              <div className="preview-modal-body-header">
                <strong>Từ ({labelOf(langSrc)})</strong>
                <strong>Nghĩa ({labelOf(langDst)})</strong>
                <span />
              </div>

              {previewList.map((item, idx) => (
                <div className="preview-modal-row" key={idx}>
                  <input
                    type="text"
                    value={item.tu || ""}
                    onChange={(e) => updatePreviewItem(idx, "tu", e.target.value)}
                    placeholder="apple"
                    style={{ padding: "8px 10px" }}
                  />
                  <input
                    type="text"
                    value={item.nghia || ""}
                    onChange={(e) => updatePreviewItem(idx, "nghia", e.target.value)}
                    placeholder="quả táo"
                    style={{ padding: "8px 10px" }}
                  />
                  <button onClick={() => removePreviewItem(idx)}>Xóa</button>
                </div>
              ))}
            </div>

            <div className="preview-modal-footer">
              <button
                className="preview-modal-footer-button"
                onClick={() => setPreviewList((prev) => [...prev, { tu: "", nghia: "" }])}
              >
                Thêm thẻ
              </button>
              <span style={{ flex: 1 }} />
              <button className="preview-modal-footer-button" onClick={onCancelPreview}>Hủy</button>
              <button className="preview-modal-footer-button save-button" onClick={onSavePreview}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
