import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClone,
  faListCheck,
  faFilePen,
  faLayerGroup,
  faPlay,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import "./HocBoThe_Header.css";

function HocBoThe_Header({ activeMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [addLib, setAddlib] = useState(false);
  const handleAddlib = () => {
    const card = JSON.parse(localStorage.getItem("selected"));
    const lib = JSON.parse(localStorage.getItem("myLib")) || [];
    if (lib.length === 0) {
      localStorage.setItem("myLib", JSON.stringify([card]));
     
    } else {
      const exist = lib.some((item) => item.idBoThe === card.idBoThe);
      if (!exist) {
        const newLib = [...lib, card];
        localStorage.setItem("myLib", JSON.stringify(newLib));
       
      }
    }
     setAddlib(true);
    
  };
  return (
    <>
      <div className="top-bar">
        <div className="back" onClick={() => navigate("/giangvien")}>
          <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
          Quay lại
        </div>
        {
          addLib && (
            <div className="notiAddLib">
              <h2 className="notiTittle">Đã Thêm Vào Thư Viện</h2>
            </div>
          )
        }
        <div className="addLib" onClick={() => handleAddlib()}>
          <FontAwesomeIcon icon={faStar} />
          Thêm vào Thư Viện
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
