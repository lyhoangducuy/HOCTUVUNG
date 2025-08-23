import { useEffect, useMemo, useRef, useState } from "react";
import { FaRobot } from "react-icons/fa";
import "./AIButton.css";
import { fetchVocabulary } from "../ChatAI/ChatBot";

export default function AIButton() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("HOC_VIEN"); // ADMIN | GIANG_VIEN | HOC_VIEN
  const menuRef = useRef(null);

  // Lấy role hiện tại từ session + local
  const loadRole = () => {
    try {
      const session = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!session?.idNguoiDung) return setRole("HOC_VIEN");

      // Ưu tiên vai trò trong bảng người dùng
      const users = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
      const found = Array.isArray(users)
        ? users.find((u) => String(u.idNguoiDung) === String(session.idNguoiDung))
        : null;

      const r = found?.vaiTro || session.vaiTro || "HOC_VIEN";
      setRole(r);
    } catch {
      setRole("HOC_VIEN");
    }
  };

  useEffect(() => {
    loadRole();
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

  const isAdmin = role === "ADMIN";

  const addCardsByTopic = async () => {
    try {
      const session = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!session?.idNguoiDung) {
        alert("Vui lòng đăng nhập trước khi tạo bộ thẻ.");
        return;
      }

      const topic = window.prompt("Nhập chủ đề bộ thẻ");
      if (!topic) return;

      const countStr = window.prompt("Số thẻ") || "10";
      const count = Math.max(1, Number(countStr) || 10);

      const danhsachThe = await fetchVocabulary(topic, count);

      const raw = localStorage.getItem("boThe");
      const list = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(list) ? list : [];

      // Tạo id tăng dần
      const ids = arr.map((c) => Number(c.idBoThe)).filter(Number.isFinite);
      const nextId = ids.length ? Math.max(...ids) + 1 : 1;

      const newCard = {
        idBoThe: String(nextId),
        tenBoThe: topic,
        idNguoiDung: session.idNguoiDung,
        danhSachThe: danhsachThe,
        soTu: Array.isArray(danhsachThe) ? danhsachThe.length : count,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("boThe", JSON.stringify([...arr, newCard]));
      alert(`Đã tạo bộ thẻ chủ đề "${topic}" (${newCard.soTu} thẻ).`);
    } catch (e) {
      console.error(e);
      alert("Không thể tạo bộ thẻ. Vui lòng thử lại.");
    } finally {
      setOpen(false);
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
          <div className="ai-item" role="menuitem" onClick={addCardsByTopic}>
            Tạo bộ thẻ theo chủ đề
          </div>
          {isAdmin && (
            <div className="ai-item" role="menuitem" onClick={addFakeUsers}>
              Thêm người dùng ảo
            </div>
          )}
        </div>
      )}
    </div>
  );
}
