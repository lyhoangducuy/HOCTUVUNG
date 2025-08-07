import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClone,
  faListCheck,
  faFilePen,
  faLayerGroup,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";

function HocBoThe_Header({url, activeMode }) {
  const navigate = useNavigate();
  const { id } = useParams(); // lấy id từ URL

  return (
    <>
      <div className="back" onClick={() => navigate(`/${url}`)}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        {"Quay lại"}
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