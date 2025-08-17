import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClone,
  faListCheck,
  faFilePen,
  faLayerGroup,
  faPlay,
  faEllipsisH,   // ⬅️ dùng dấu …
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import "./HocBoThe_Header.css";

function HocBoThe_Header({ activeMode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // menu dấu …
  const [moMenu, setMoMenu] = useState(false);
  const nutMenuRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!moMenu) return;
    function handleOutside(e) {
      const btn = nutMenuRef.current;
      const menu = menuRef.current;
      if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        setMoMenu(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [moMenu]);

  // Tìm bộ thẻ theo id từ localStorage
  const docBoThe = () => {
    try {
      const arr = JSON.parse(localStorage.getItem("boThe") || "[]");
      return (Array.isArray(arr) ? arr.find(x => String(x.idBoThe) === String(id)) : null) || null;
    } catch {
      return null;
    }
  };

  const handleXoaBoThe = () => {
    const bt = docBoThe();
    if (!bt) {
      alert("Không tìm thấy bộ thẻ.");
      return;
    }
    const ok = window.confirm(`Xoá bộ thẻ "${bt.tenBoThe}"? Hành động này không thể hoàn tác.`);
    if (!ok) return;

    const list = JSON.parse(localStorage.getItem("boThe") || "[]");
    const newList = list.filter(x => String(x.idBoThe) !== String(id));
    localStorage.setItem("boThe", JSON.stringify(newList));

    // nếu đang lưu "selected" là bộ này thì xoá để tránh lỗi trang khác
    const sel = JSON.parse(localStorage.getItem("selected") || "null");
    if (sel && String(sel.idBoThe) === String(id)) {
      localStorage.removeItem("selected");
    }

    // tuỳ ý bắn event cho nơi khác lắng nghe
    window.dispatchEvent(new Event("boTheUpdated"));

    alert("Đã xoá bộ thẻ.");
    navigate("/giangvien");
  };

  const handleSuaBoThe = () => {
    const bt = docBoThe();
    if (!bt) {
      alert("Không tìm thấy bộ thẻ.");
      return;
    }
    // Lưu tạm để trang chỉnh sửa lấy dữ liệu fill form
    localStorage.setItem("selected", JSON.stringify(bt));
    // Điều hướng tới trang sửa (đổi route theo app của bạn)
    navigate(`/suabothe/${id}`);
  };

  return (
    <>
      <div className="top-bar">
        <div className="back" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
          Quay lại
        </div>

        {/* Nút dấu … */}
        <div className="more-wrapper">
          <button
            ref={nutMenuRef}
            className="more-btn"
            onClick={() => setMoMenu(v => !v)}
            aria-haspopup="menu"
            aria-expanded={moMenu}
            title="Tùy chọn"
          >
            <FontAwesomeIcon icon={faEllipsisH} />
          </button>

          {moMenu && (
            <div ref={menuRef} className="more-menu">
              <button className="more-item" onClick={handleSuaBoThe}>
                Sửa bộ thẻ
              </button>
              <button className="more-item danger" onClick={handleXoaBoThe}>
                Xoá bộ thẻ
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="studyChange">
        <div
          className={`studyBtn ${activeMode === "flashcard" ? "active" : ""}`}
          onClick={() => navigate(`/flashcard/${id}`)}
        >
          <FontAwesomeIcon icon={faClone} />
          <span>Flashcards</span>
        </div>

        <div
          className={`studyBtn ${activeMode === "tracnghiem" ? "active" : ""}`}
          onClick={() => navigate(`/tracnghiem/${id}`)}
        >
          <FontAwesomeIcon icon={faListCheck} />
          <span>Trắc nghiệm</span>
        </div>

        <div
          className={`studyBtn ${activeMode === "test" ? "active" : ""}`}
          onClick={() => navigate(`/test/${id}`)}
        >
          <FontAwesomeIcon icon={faFilePen} />
          <span>Test</span>
        </div>

        <div
          className={`studyBtn ${activeMode === "game" ? "active" : ""}`}
          onClick={() => navigate(`/game/${id}`)}
        >
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>Match game</span>
        </div>

        <div
          className={`studyBtn ${activeMode === "video" ? "active" : ""}`}
          onClick={() => navigate(`/video/${id}`)}
        >
          <FontAwesomeIcon icon={faPlay} />
          <span>Học bằng video</span>
        </div>
      </div>
    </>
  );
}

export default HocBoThe_Header;
