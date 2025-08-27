// src/components/AIButton.jsx
import { useEffect, useRef, useState } from "react";
import { FaRobot } from "react-icons/fa";
import "./AIButton.css";
import { fetchVocabulary } from "../ChatAI/ChatBot";

// Firebase
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export default function AIButton() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Loading & form tạo bộ thẻ
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTopic, setPreviewTopic] = useState("");
  const [previewList, setPreviewList] = useState([]); // [{tu, nghia}]

  // User hiện tại (đồng bộ từ Firebase Auth + Firestore profile)
  const [user, setUser] = useState(null);

  /* ============= Effects ============= */
  useEffect(() => {
    // Lắng nghe đăng nhập từ Firebase Auth
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        return;
      }
      try {
        // Đọc profile để lấy vaiTro, tên, ...
        const pRef = doc(db, "nguoiDung", fbUser.uid);
        const snap = await getDoc(pRef);
        const profile = snap.exists() ? snap.data() : {};

        setUser({
          idNguoiDung: fbUser.uid,
          email: fbUser.email || profile.email || "",
          tenNguoiDung: profile.tenNguoiDung || fbUser.displayName || "",
          hoten: profile.hoten || "",
          vaiTro: profile.vaiTro || "HOC_VIEN", // mặc định
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
    // đóng menu khi click ngoài
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

    setShowForm(false);
    setError("");
    setLoading(true);
    try {
      const ds = await fetchVocabulary(topic, num);
      setPreviewTopic(topic);
      setPreviewList(Array.isArray(ds) ? ds : []);
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
      if (!user?.idNguoiDung) {
        alert("Vui lòng đăng nhập.");
        return;
      }
      if (user?.vaiTro !== "ADMIN") {
        alert("Chức năng này chỉ dành cho ADMIN.");
        return;
      }

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
          // CHÚ Ý: đây chỉ là "hồ sơ" trong Firestore, không tạo tài khoản Auth!
          matkhau: "123123", // chỉ để mock hiển thị, KHÔNG dùng thật
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

  const onSavePreview = async () => {
    const userCreated = user?.idNguoiDung;

    const valid = previewList
      .map((t) => ({
        tu: String(t?.tu || "").trim(),
        nghia: String(t?.nghia || "").trim(),
      }))
      .filter((t) => t.tu && t.nghia);

    if (!valid.length) {
      alert("Danh sách thẻ trống hoặc không hợp lệ.");
      return;
    }
    if (!userCreated) {
      alert("Vui lòng đăng nhập.");
      return;
    }

    try {
      // Lưu vào Firestore collection "boThe"
      await addDoc(collection(db, "boThe"), {
        tenBoThe: previewTopic,
        idNguoiDung: userCreated,
        danhSachThe: valid,
        soTu: valid.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // (Tuỳ app) phát event để nơi khác cập nhật lại data
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
              <button onClick={closeCreateForm} aria-label="Đóng">
                X
              </button>
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

                {error && (
                  <div style={{ color: "#d33", fontSize: 14 }}>{error}</div>
                )}

                <div className="create-form-modal-content-form-button">
                  <button type="button" onClick={closeCreateForm}>
                    Hủy
                  </button>
                  <button type="submit" disabled={loading}>
                    Tạo
                  </button>
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
                <strong>Từ</strong>
                <strong>Nghĩa</strong>
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
                    onChange={(e) =>
                      updatePreviewItem(idx, "nghia", e.target.value)
                    }
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
                onClick={() =>
                  setPreviewList((prev) => [...prev, { tu: "", nghia: "" }])
                }
              >
                Thêm thẻ
              </button>
              <span style={{ flex: 1 }} />
              <button
                className="preview-modal-footer-button"
                onClick={onCancelPreview}
              >
                Hủy
              </button>
              <button
                className="preview-modal-footer-button save-button"
                onClick={onSavePreview}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
