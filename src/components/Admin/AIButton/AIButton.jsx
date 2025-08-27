// src/components/AIButton.jsx
import { useEffect, useRef, useState } from "react";
import { FaRobot } from "react-icons/fa";
import "./AIButton.css";
import { fetchVocabulary } from "../ChatAI/ChatBot";

// Firebase
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,     // +++
  query,       // +++
  where,       // +++
  setDoc,      // +++
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

// ===== Ngôn ngữ (giữ nguyên) =====
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

export default function AIButton() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Loading & form tạo bộ thẻ
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");

  // Ngôn ngữ
  const [langSrc, setLangSrc] = useState("vi");
  const [langDst, setLangDst] = useState("en");

  // ➕ Chế độ hiển thị (để lưu giống NewBoThe)
  const [cheDo, setCheDo] = useState("ca_nhan"); // "cong_khai" | "ca_nhan"

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTopic, setPreviewTopic] = useState("");
  const [previewList, setPreviewList] = useState([]); // [{tu, nghia}]

  // User hiện tại
  const [user, setUser] = useState(null);

  /* ============= Effects ============= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        return;
      }
      try {
        const pRef = doc(db, "nguoiDung", fbUser.uid);
        const snap = await getDoc(pRef);
        const profile = snap.exists() ? snap.data() : {};
        setUser({
          idNguoiDung: fbUser.uid,
          email: fbUser.email || profile.email || "",
          tenNguoiDung: profile.tenNguoiDung || fbUser.displayName || "",
          hoten: profile.hoten || "",
          vaiTro: profile.vaiTro || "HOC_VIEN",
          anhDaiDien: profile.anhDaiDien || fbUser.photoURL || "",
        });
      } catch (e) {
        console.error("Lỗi nạp hồ sơ người dùng:", e);
        setUser({
          idNguoiDung: fbUser.uid,
          email: fbUser.email || "",
          tenNguoiDung: fbUser.displayName || "",
          hoten: "",
          vaiTro: "HOC_VIEN",
          anhDaiDien: fbUser.photoURL || "",
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* ============= Tạo bộ thẻ bằng AI ============= */
  const openCreateForm = () => {
    if (loading) return;
    setTopic("");
    setCount(1);
    setLangSrc("vi");
    setLangDst("en");
    setCheDo("ca_nhan"); // reset chế độ
    setError("");
    setShowForm(true);
    setOpen(false);
  };

  const closeCreateForm = () => {
    setShowForm(false);
    setError("");
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!user?.idNguoiDung) {
      alert("Vui lòng đăng nhập để tạo bộ thẻ.");
      return;
    }
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề.");
      return;
    }
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

    setShowForm(false);
    setError("");
    setLoading(true);
    try {
      const ds = await fetchVocabulary(topic, num, langSrc, langDst);
      setPreviewTopic(topic);
      setPreviewList((Array.isArray(ds) ? ds : []).slice(0, num));
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      alert("Không thể tạo bộ thẻ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /* ============= ADMIN: thêm user ảo (Firestore) ============= */
  const addFakeUsers = async () => {
    try {
      if (!user?.idNguoiDung) return alert("Vui lòng đăng nhập.");
      if (user?.vaiTro !== "ADMIN") return alert("Chức năng này chỉ dành cho ADMIN.");

      const nStr = window.prompt("Thêm bao nhiêu người dùng ảo? (VD: 5)");
      const n = Number(nStr);
      const total = Number.isFinite(n) && n > 0 ? n : 3;

      const batch = writeBatch(db);
      const now = Date.now();

      for (let i = 0; i < total; i++) {
        const ref = doc(collection(db, "nguoiDung")); // id ngẫu nhiên
        const idNguoiDung = ref.id;
        const username = "user" + String(now + i).slice(-5);

        batch.set(ref, {
          idNguoiDung,
          tenNguoiDung: username,
          hoten: "Người dùng ảo " + (i + 1),
          email: `${username}@example.com`,
          matkhau: "123123", // chỉ để mock hiển thị
          vaiTro: "HOC_VIEN",
          ngayTaoTaiKhoan: serverTimestamp(),
          anhDaiDien: "",
          isFake: true,
        });
      }

      await batch.commit();
      alert(`Đã thêm ${total} người dùng ảo vào Firestore (collection "nguoiDung").`);
    } catch (e) {
      console.error("AI thêm người dùng ảo thất bại", e);
      alert("Không thể thêm người dùng ảo. Vui lòng thử lại.");
    } finally {
      setOpen(false);
    }
  };

  /* ============= Helper: tạo idBoThe 6 số & check trùng ============= */
  const genUniqueIdBoThe = async () => {
    for (let i = 0; i < 5; i++) {
      const id = Math.floor(100000 + Math.random() * 900000); // 100000..999999
      const q = query(collection(db, "boThe"), where("idBoThe", "==", id));
      const snap = await getDocs(q);
      if (snap.empty) return id;
    }
    return Number(String(Date.now()).slice(-6)); // fallback
  };

  /* ============= Preview thao tác ============= */
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

  const onCancelPreview = () => {
    setPreviewOpen(false);
  };

  /* ============= LƯU: flow GIỐNG NewBoThe ============= */
  const onSavePreview = async () => {
    const userCreated = user?.idNguoiDung;

    // Lọc thẻ hợp lệ
    const valid = previewList
      .map((t) => ({
        tu: String(t?.tu || "").trim(),
        nghia: String(t?.nghia || "").trim(),
      }))
      .filter((t) => t.tu && t.nghia);

    if (!valid.length) return alert("Danh sách thẻ trống hoặc không hợp lệ.");
    if (!userCreated) return alert("Vui lòng đăng nhập.");

    try {
      // idBoThe 6 chữ số + docId = idBoThe
      const idBoThe = await genUniqueIdBoThe();

      // LƯU ĐÚNG CẤU TRÚC: { idBoThe, tenBoThe, soTu, idNguoiDung, danhSachThe, luotHoc, cheDo }
      await setDoc(doc(db, "boThe", String(idBoThe)), {
        idBoThe,
        tenBoThe: String(previewTopic || "").trim(),
        soTu: valid.length,
        idNguoiDung: String(userCreated),
        danhSachThe: valid,
        luotHoc: 0,
        cheDo, // "cong_khai" | "ca_nhan"
      }, { merge: true });

      window.dispatchEvent(new Event("boTheUpdated"));
      setPreviewOpen(false);
      alert("Đã lưu bộ thẻ: " + previewTopic);
    } catch (e) {
      console.error("Lưu bộ thẻ thất bại:", e);
      alert("Không thể lưu bộ thẻ. Vui lòng thử lại.");
    }
  };

  const isAdmin = user?.vaiTro === "ADMIN";

  /* ============= Render ============= */
  return (
    <div className="ai-button-container" ref={menuRef}>
      <button
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        title="AI trợ giúp"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <FaRobot />
      </button>

      {open && (
        <div className="ai-dropdown">
          <div
            className={`ai-item${loading ? " disabled" : ""}`}
            onClick={!loading ? openCreateForm : undefined}
          >
            {loading ? "Đang tạo..." : "Tạo bộ thẻ theo chủ đề"}
          </div>

          {isAdmin && (
            <div className="ai-item" onClick={addFakeUsers}>
              Thêm người dùng ảo
            </div>
          )}
        </div>
      )}

      {/* Modal tạo nhanh */}
      {showForm && (
        <div className="create-form-modal">
          <div className="create-form-modal-content">
            <div className="create-form-modal-content-header">
              <h3>Tạo bộ thẻ</h3>
              <button onClick={closeCreateForm} aria-label="Đóng">X</button>
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

                {/* ➕ Chế độ để lưu giống NewBoThe */}
                <label className="create-form-modal-content-form-label">
                  <span>Chế độ</span>
                  <select value={cheDo} onChange={(e) => setCheDo(e.target.value)}>
                    <option value="cong_khai">Công khai — ai cũng tìm & học được</option>
                    <option value="ca_nhan">Cá nhân — chỉ mình tôi thấy</option>
                  </select>
                </label>

                <label>
                  <span>Số lượng (tối đa 9 vì dùng chatbot free -_-)</span>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={count}
                    onChange={(e) => {
                      const v =
                        e.target.value === ""
                          ? ""
                          : Math.max(1, Math.min(9, Number(e.target.value)));
                      setCount(v);
                    }}
                    placeholder="1 - 9"
                  />
                </label>

                {error && <div style={{ color: "#d33", fontSize: 14 }}>{error}</div>}

                <div className="create-form-modal-content-form-button">
                  <button type="button" onClick={closeCreateForm}>Hủy</button>
                  <button type="submit" disabled={loading}>Tạo</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal preview */}
      {previewOpen && (
        <div className="preview-modal">
          <div className="preview-modal-content">
            <div className="preview-modal-header">
              <h1 className="preview-modal-header-title">
                Xem lại bộ thẻ: {previewTopic}
              </h1>
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
              <button className="preview-modal-footer-button" onClick={onCancelPreview}>
                Hủy
              </button>
              <button className="preview-modal-footer-button save-button" onClick={onSavePreview}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
