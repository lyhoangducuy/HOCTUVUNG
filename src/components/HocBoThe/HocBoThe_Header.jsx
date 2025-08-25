import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClone,
  faListCheck,
  faFilePen,
  faLayerGroup,
  faPlay,
  faEllipsisH,
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

  // session hiện tại
  const session = JSON.parse(sessionStorage.getItem("session") || "null");

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
      return (
        (Array.isArray(arr) ? arr.find((x) => String(x.idBoThe) === String(id)) : null) ||
        null
      );
    } catch {
      return null;
    }
  };

  const bt = docBoThe();
  const isOwner =
    bt && session?.idNguoiDung && String(bt.idNguoiDung) === String(session.idNguoiDung);

  const handleXoaBoThe = () => {
    if (!isOwner) return; // chặn nếu không phải chủ sở hữu

    const ok = window.confirm(
      `Xoá bộ thẻ "${bt.tenBoThe}"? Hành động này không thể hoàn tác.`
    );
    if (!ok) return;

    const list = JSON.parse(localStorage.getItem("boThe") || "[]");
    const newList = list.filter((x) => String(x.idBoThe) !== String(id));
    localStorage.setItem("boThe", JSON.stringify(newList));

    const sel = JSON.parse(localStorage.getItem("selected") || "null");
    if (sel && String(sel.idBoThe) === String(id)) {
      localStorage.removeItem("selected");
    }

    window.dispatchEvent(new Event("boTheUpdated"));
    alert("Đã xoá bộ thẻ.");
    navigate("/giangvien");
  };

  const handleSuaBoThe = () => {
    if (!isOwner) return;

    // Lưu tạm để trang chỉnh sửa lấy dữ liệu fill form
    localStorage.setItem("selected", JSON.stringify(bt));
    navigate(`/suabothe/${id}`);
  };

  return (
    <>
      <div className="top-bar">
        <div className="back" onClick={() => navigate("/trangchu")}>
          <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
          Quay lại
        </div>

        {/* Nút dấu … chỉ hiện nếu là chủ sở hữu */}
        {isOwner && (
          <div className="more-wrapper">
            <button
              ref={nutMenuRef}
              className="more-btn"
              onClick={() => setMoMenu((v) => !v)}
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
        )}
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

        
      </div>
    </>
  );
}

export default HocBoThe_Header;
