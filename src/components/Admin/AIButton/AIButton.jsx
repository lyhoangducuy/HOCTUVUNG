import { useEffect, useRef, useState } from "react";
import { FaRobot } from "react-icons/fa";
import "./AIButton.css";
import { fetchVocabulary } from "../ChatAI/ChatBot";

export default function AIButton() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("HOC_VIEN"); // ADMIN | GIANG_VIEN | HOC_VIEN
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);

  // Form tạo bộ thẻ
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");

  // Modal preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTopic, setPreviewTopic] = useState("");
  const [previewList, setPreviewList] = useState([]); // [{tu, nghia}]

  const menuRef = useRef(null);

  // ---- Helpers ----
  const loadRole = () => {
    try {
      const ss = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!ss?.idNguoiDung) {
        setUser(null);
        setRole("HOC_VIEN");
        return;
      }
      setUser(ss);

      // Ưu tiên vai trò trong bảng người dùng
      const users = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
      const found = Array.isArray(users)
        ? users.find((u) => String(u.idNguoiDung) === String(ss.idNguoiDung))
        : null;

      const r = found?.vaiTro || ss.vaiTro || "HOC_VIEN";
      setRole(r);
    } catch {
      setUser(null);
      setRole("HOC_VIEN");
    }
  };

  const isAdmin = (user?.vaiTro || role) === "ADMIN";

  // ---- Effects ----
  useEffect(() => {
    loadRole();

    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
    };
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (["nguoiDung"].includes(e.key)) loadRole();
    };

    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // ---- Create Card Flow ----
  const openCreateForm = () => {
    if (loading) return;
    const ss = JSON.parse(sessionStorage.getItem("session") || "null");
    if (!ss?.idNguoiDung) {
      alert("Vui lòng đăng nhập trước khi tạo bộ thẻ.");
      return;
    }
    setTopic("");
    setCount(1);
    setError("");
    setOpen(false);
    setShowForm(true);
  };

  const closeCreateForm = () => {
    setShowForm(false);
    setError("");
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
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

  // ---- Admin: Thêm user ảo ----
  const addFakeUsers = () => {
    try {
      const ss = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!ss?.idNguoiDung) {
        alert("Vui lòng đăng nhập.");
        return;
      }
      if (!isAdmin) {
        alert("Chức năng này chỉ dành cho ADMIN.");
        return;
      }

      const nStr = window.prompt("Thêm bao nhiêu người dùng ảo? (VD: 5)");
      const n = Number(nStr);
      const total = Number.isFinite(n) && n > 0 ? n : 3;

      const ds = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
      const list = Array.isArray(ds) ? ds : [];
      const now = Date.now();

      const newOnes = Array.from({ length: total }).map((_, i) => {
        const idNguoiDung = String(now + i);
        const username = "user" + idNguoiDung.slice(-5);
        return {
          idNguoiDung,
          tenNguoiDung: username,
          hoten: "Người dùng ảo " + (i + 1),
          email: `${username}@example.com`,
          matkhau: "123123",
          vaiTro: "HOC_VIEN",
          ngayTaoTaiKhoan: new Date().toISOString(),
          anhDaiDien: "",
        };
      });

      localStorage.setItem("nguoiDung", JSON.stringify([...list, ...newOnes]));
      alert(`Đã thêm ${total} người dùng ảo.`);
    } catch (e) {
      console.error("AI thêm người dùng ảo thất bại", e);
      alert("Không thể thêm người dùng ảo. Vui lòng thử lại.");
    } finally {
      setOpen(false);
    }
  };

  // ---- Preview modal actions ----
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
    setPreviewOpen(false); // đóng, KHÔNG lưu
  };

  const onOkSave = () => {
    const ss = JSON.parse(sessionStorage.getItem("session") || "null");
    const userCreated = ss?.idNguoiDung;
    if (!userCreated) {
      alert("Vui lòng đăng nhập.");
      return;
    }

    // Lọc thẻ hợp lệ
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

    // Lấy danh sách bộ thẻ cũ
    const raw = localStorage.getItem("boThe");
    const cards = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(cards) ? cards : [];

    // Tạo id tăng dần
    const ids = list.map((c) => Number(c.idBoThe)).filter(Number.isFinite);
    const nextId = ids.length ? Math.max(...ids) + 1 : 1;

    const newCard = {
      idBoThe: String(nextId),
      tenBoThe: previewTopic,
      idNguoiDung: userCreated,
      danhSachThe: valid,
      soTu: valid.length,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("boThe", JSON.stringify([...list, newCard]));
    setPreviewOpen(false);
    alert('Đã lưu bộ thẻ: "' + previewTopic + '"');
  };

  // ---- Render ----
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
        <div className="ai-dropdown" role="menu">
          <div
            className={`ai-item${loading ? " disabled" : ""}`}
            role="menuitem"
            onClick={!loading ? openCreateForm : undefined}
          >
            {loading ? "Đang tạo..." : "Tạo bộ thẻ theo chủ đề"}
          </div>

          {isAdmin && (
            <div className="ai-item" role="menuitem" onClick={addFakeUsers}>
              Thêm người dùng ảo
            </div>
          )}
        </div>
      )}

      {/* Modal tạo bộ thẻ */}
      {showForm && (
        <div className="create-form-modal" role="dialog" aria-modal="true">
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
                    autoFocus
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

      {/* Modal preview kết quả */}
      {previewOpen && (
        <div className="preview-modal" role="dialog" aria-modal="true">
          <div className="preview-modal-content">
            <div className="preview-modal-header">
              <h1 className="preview-modal-header-title">
                Xem lại bộ thẻ: {previewTopic}
              </h1>
              <button onClick={onCancelPreview} aria-label="Đóng">
                X
              </button>
            </div>

            <div className="preview-modal-body">
              <div className="preview-modal-body-header">
                <strong>Từ</strong>
                <strong>Nghĩa</strong>
                <span />
              </div>
              {previewList.map((item, idx) => (
                <div key={idx} className="preview-modal-body-item">
                  <input
                    type="text"
                    value={item.tu || ""}
                    onChange={(e) =>
                      updatePreviewItem(idx, "tu", e.target.value)
                    }
                    placeholder="apple"
                  />
                  <input
                    type="text"
                    value={item.nghia || ""}
                    onChange={(e) =>
                      updatePreviewItem(idx, "nghia", e.target.value)
                    }
                    placeholder="quả táo"
                  />
                  <button onClick={() => removePreviewItem(idx)}>Xóa</button>
                </div>
              ))}
            </div>

            <div className="preview-modal-footer">
              <button
                className="preview-modal-footer-button save-button"
                onClick={() =>
                  setPreviewList((prev) => [...prev, { tu: "", nghia: "" }])
                }
              >
                Thêm thẻ
              </button>
              <button
                className="preview-modal-footer-button cancel-button"
                onClick={onOkSave}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
