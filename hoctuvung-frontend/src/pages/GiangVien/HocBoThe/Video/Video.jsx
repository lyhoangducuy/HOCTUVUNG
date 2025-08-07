import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClone,
  faListCheck,
  faLayerGroup,
  faFilePen,
  faPlay,
  faArrowLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import "./Video.css";

function Video() {
  const { id } = useParams();
  const nagative = useNavigate();
  const [card, setCard] = useState([]);
  const [video, setVideo] = useState();
  const [answer, setAnswer] = useState();
  const [correct, setCorrect] = useState(false);
  const [choice, setChoice] = useState(false);
  const [play, setPlay] = useState(false);
  const videoRef = useRef();
  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("selected"));
    if (selected) {
      setCard(selected);
    }
  }, []);
  useEffect(() => {
    setVideo(card.video);
  }, [card]);
  useEffect(() => {
    setTimeout(() => {
      videoRef.current.play();
      setPlay(true);
    }, 1000);
  }, [video]);
  useEffect(() => {
    setTimeout(() => {
      videoRef.current.pause();
      setPlay(false);
    }, 20000);
  }, [play]);
  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("youtube.com/shorts/")) {
      const videoId = url.split("shorts/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return url;
  };

  const handleSubmit = () => {
    setChoice(true);
    if (answer === video.answer[0] || answer === video.answer[1]) {
      setCorrect(true);
    }
    setTimeout(() => {
      setChoice(false);
    }, 500);
  };

  return (
    <div className="container">
      <div className="back" onClick={() => nagative("/giangvien")}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        {"Quay lại"}
      </div>

      <div className="studyChange">
        <div className="studyBtn " onClick={() => nagative(`/flashcard/${id}`)}>
          <FontAwesomeIcon icon={faClone} />
          <span>Flashcards</span>
        </div>
        <div
          className="studyBtn "
          onClick={() => nagative(`/tracnghiem/${id}`)}
        >
          <FontAwesomeIcon icon={faListCheck} />
          <span>Trắc nghiệm</span>
        </div>
        <div className="studyBtn" onClick={() => nagative(`/test/${id}`)}>
          <FontAwesomeIcon icon={faFilePen} />
          <span>Test</span>
        </div>
        <div className="studyBtn" onClick={() => nagative(`/game/${id}`)}>
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>Match game</span>
        </div>
        <div
          className="studyBtn active"
          onClick={() => nagative(`/video/${id}`)}
        >
          <FontAwesomeIcon icon={faPlay} />
          <span>Học bằng video</span>
        </div>
      </div>

      <div className="main">
        <div className="study">
          <div className="video-card">
            <h3 className="video-title">{card?.tenBoThe}</h3>
            <div className="video-frame">
              <video
                ref={videoRef}
                width="100%"
                height="315"
                controls
                src={video?.src}
                title={card?.tenBoThe}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></video>
            </div>
          </div>
          <div className="answer_video">
            <input
              type="text"
              placeholder="Nhập cụm từ bạn nghe được"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button onClick={() => handleSubmit()}>Nộp</button>
            {choice && (correct ? <p>ĐÚNG</p> : <p>SAI</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Video;
