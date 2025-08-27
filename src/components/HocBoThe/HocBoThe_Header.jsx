import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClone,
  faListCheck,
  faFilePen,
  faLayerGroup,
  faEllipsisH,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import "./HocBoThe_Header.css";

import { auth, db } from "../../../lib/firebase";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";

function HocBoThe_Header({ activeMode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // menu dấu …
  const [moMenu, setMoMenu] = useState(false);
  const nutMenuRef = useRef(null);
  const menuRef = useRef(null);

  // bộ thẻ & quyền sở hữu
  const [boThe, setBoThe] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  // đóng menu khi click ra ngoài
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

  // Nạp bộ thẻ từ Firestore + tính quyền
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "boThe", String(id));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        setBoThe(data);

        const session = JSON.parse(sessionStorage.getItem("session") || "null");
        const uid = auth.currentUser?.uid || session?.idNguoiDung;
        setIsOwner(Boolean(data && uid && String(data.idNguoiDung) === String(uid)));
      },
      () => {
        setBoThe(null);
        setIsOwner(false);
      }
    );
    return () => unsub();
  }, [id]);

  const handleXoaBoThe = async () => {
    if (!isOwner || !boThe) return;
    const ok = window.confirm(`Xoá bộ thẻ "${boThe.tenBoThe}"? Hành động này không thể hoàn tác.`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "boThe", String(id)));
      alert("Đã xoá bộ thẻ.");
      navigate("/giangvien");
    } catch (e) {
      console.error(e);
      alert("Không thể xoá bộ thẻ. Vui lòng thử lại.");
    }
  };

  const handleSuaBoThe = () => {
    if (!isOwner) return;
    navigate(`/suabothe/${id}`);
  };

  return (
    <>
      <div className="top-bar">
        <div className="back" onClick={() => navigate(-1)}>
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
