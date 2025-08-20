import { useEffect, useRef, useState } from "react";
import { FaRobot } from "react-icons/fa";
import "./AIButton.css";
import {generateVocabulary} from "../../../services/ai/generateVocabulary"
import { Await } from "react-router-dom";
export default function AIButton() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const getCurrentUserName = () => {
    try {
      const session = JSON.parse(sessionStorage.getItem("session") || "null");
      const ds = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
      const me = ds.find((u) => u.idNguoiDung === session?.idNguoiDung);
      return me?.tenNguoiDung || "Ẩn danh";
    } catch {
      return "Ẩn danh";
    }
  };

  const addCardsByTopic = async () => {
    const topic = window.prompt("Nhập chủ đề bộ thẻ ");
    if (!topic) return;
    const countStr = window.prompt("Số thẻ") || 10;
    const session = JSON.parse(sessionStorage.getItem("session") || "null");
    const userCreated = session.idNguoiDung;
    const danhsachThe = await generateVocabulary(topic, countStr); // gọi AI/fallback

   
    const raw = localStorage.getItem("boThe");
    const cards = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(cards) ? cards : [];
    const ids = list.map((c) => Number( c.idBoThe)).filter(Number.isFinite);
    const nextId = ids.length ? Math.max(...ids) + 1 : 1;


      
      const newCard = {
        idBoThe: String(nextId),
        tenBoThe: topic,
        idNguoiDung: userCreated,
        danhsachThe,
        soTu: Array.isArray(danhSachThe) ? danhSachThe.length : count,
      };

      localStorage.setItem("boThe", JSON.stringify([...list, newCard]));
      alert("Đã tạo bộ thẻ chủ đề: " + topic);

  };

  const addFakeUsers = () => {
    const nStr = window.prompt("Thêm bao nhiêu người dùng ảo? (VD: 5)");
    const n = Number(nStr);
    const total = Number.isFinite(n) && n > 0 ? n : 3;
    try {
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
    }
  };

  return (
    <div className="ai-button-container" ref={menuRef}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)} title="AI trợ giúp">
        <FaRobot />
      </button>
      {open && (
        <div className="ai-dropdown">
          <div className="ai-item" onClick={addCardsByTopic}>Tạo bộ thẻ theo chủ đề</div>
          <div className="ai-item" onClick={addFakeUsers}>Thêm người dùng ảo</div>
        </div>
      )}
    </div>
  );
}


