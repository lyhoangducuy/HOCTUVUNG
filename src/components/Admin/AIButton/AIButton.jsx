import { useEffect, useMemo, useRef, useState } from "react";
import { FaRobot } from "react-icons/fa";
import "./AIButton.css";
import { fetchVocabulary } from "../ChatAI/ChatBot";
import React from "react";
export default function AIButton() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("HOC_VIEN"); // ADMIN | GIANG_VIEN | HOC_VIEN
  const menuRef = useRef(null);

  const [loading, setLoading] = useState(false);
    // Thêm vào đầu component
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");

// Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTopic, setPreviewTopic] = useState("");
  const [previewList, setPreviewList] = useState([]); // [{tu, nghia}]
    useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onStorage = (e) => {
      if (!e || !e.key) return;
      // Nếu thay đổi phiên hoặc danh sách người dùng → cập nhật role
      if (["nguoiDung"].includes(e.key)) loadRole();
    };

    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("storage", onStorage);
    };
  }, []);


const openCreateForm = () => {
	if (loading) return;
	setTopic("");
	setCount(1);
	setError("");
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
  setShowForm(false);
  setError("");
  setLoading(true);
  try {
    const ds = await fetchVocabulary(topic, num);
    setPreviewTopic(topic);
    setPreviewList(Array.isArray(ds) ? ds : []);
    setPreviewOpen(true);
  } catch (e) {
    console.error(e);
    alert("Không thể tạo bộ thẻ. Vui lòng thử lại.");
  } finally {
    setLoading(false);
  }

};

   
  const addFakeUsers = () => {
    try {
      const session = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!session?.idNguoiDung) {
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
  const updatePreviewItem = (idx, field, value) => {
    setPreviewList(prev => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  
  const removePreviewItem = (idx) => {
    setPreviewList(prev => prev.filter((_, i) => i !== idx));
  };
  
  const onCancel = () => {
    setPreviewOpen(false); // đóng, KHÔNG lưu
  };
  const [user, setUser] = useState(null);
  useEffect (() => {
    const session = JSON.parse(sessionStorage.getItem("session") || "null");
    if(session !== null){
      setUser(session)
    }
  },[]);
 
  
  const onOkSave = () => {
    
    const userCreated = user?.idNguoiDung;
  
    // Lọc thẻ hợp lệ
    const valid = previewList
      .map(t => ({ tu: String(t?.tu || "").trim(), nghia: String(t?.nghia || "").trim() }))
      .filter(t => t.tu && t.nghia);
  
    if (!valid.length) {
      alert("Danh sách thẻ trống hoặc không hợp lệ.");
      return;
    }
  
    // Lấy danh sách bộ thẻ cũ
    const raw = localStorage.getItem("boThe");
    const cards = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(cards) ? cards : [];
  
    // Tạo id tăng dần
    const ids = list.map(c => Number(c.idBoThe)).filter(Number.isFinite);
    const nextId = ids.length ? Math.max(...ids) + 1 : 1;
  
    const newCard = {
      idBoThe: String(nextId),
      tenBoThe: previewTopic,
      idNguoiDung: userCreated,
      danhSachThe: valid,    // CHÚ Ý: dùng danhSachThe (S hoa)
      soTu: valid.length,
    };
  
    localStorage.setItem("boThe", JSON.stringify([...list, newCard]));
    setPreviewOpen(false);
    alert("Đã lưu bộ thẻ: " + previewTopic);
  };

 
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
          <div className={`ai-item${loading ? " disabled" : ""}`} onClick={!loading ? openCreateForm : undefined}>
              {loading ? "Đang tạo..." : "Tạo bộ thẻ theo chủ đề"}
          </div>
          {user.vaiTro === "ADMIN" && (
            <div className="ai-item" onClick={addFakeUsers}>
            Thêm người dùng ảo
          </div>
             
          )
          } 
          </div>
      )}
      {showForm && (
        <div className="create-form-modal">
          <div className="create-form-modal-content">
            <div className="create-form-modal-content-header">
            <h3 >Tạo bộ thẻ</h3>
            <button onClick={closeCreateForm}>X</button>
            </div>
            <form onSubmit={handleSubmitCreate}>
              <div className="create-form-modal-content-form" >
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
                      const v = e.target.value === "" ? "" : Math.max(1, Math.min(9, Number(e.target.value)));
                      setCount(v);
                    }}
                    placeholder="1 - 9"
                  />
                </label>

                {error && <div style={{ color: "#d33", fontSize: 14 }}>{error}</div>}

                <div className="create-form-modal-content-form-button" >
                  <button
                    type="button"
                    onClick={closeCreateForm}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading} 
                  >
                    Tạo
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {previewOpen && (
    <div className="preview-modal">
    <div className="preview-modal-content" >
      <div className="preview-modal-header" >
        <h1  className="preview-modal-header-title">Xem lại bộ thẻ: {previewTopic}</h1>
        <button onClick={onCancel}>X</button>
      </div>

      <div className="preview-modal-body" >
        <strong>Từ</strong>
        <strong>Nghĩa</strong>
        <span />
        {previewList.map((item, idx) => (
          <React.Fragment key={idx} className="preview-modal-body-item" >
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
          </React.Fragment>
        ))}
      </div>

      <div className="preview-modal-footer" >
        <button className="preview-modal-footer-button save-button" onClick={() => setPreviewList(prev => [...prev, { tu: "", nghia: "" }])}>Thêm thẻ</button>
        <button className="preview-modal-footer-button cancel-button" onClick={onOkSave}>OK</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
