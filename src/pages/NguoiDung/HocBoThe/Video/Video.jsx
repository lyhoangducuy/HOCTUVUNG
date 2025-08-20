import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import "./Video.css";

function Video() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [video, setVideo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState({});
  const [submit, setSubmit] = useState({});

  const videoRef = useRef(null);
  const inputRef = useRef([]);

  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("selected") || "null");
    setCard(selected);
  }, [id]);

  useEffect(() => {
    setVideo(card?.video || null);
  }, [card]);

  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(videoRef.current?.currentTime);
    };

    videoRef.current?.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);
  useEffect(() => {
    video?.transcript?.map((item, index) => {
     if (Math.abs(currentTime - item.t) < 0.1) { 
      if (!submit[index]) { 
        inputRef.current[index]?.focus();
        videoRef.current.pause();
      }
    }
    });
  }, [currentTime,submit]);
  const handleAnswers = (index, value) => {
    setUserAnswers((pre) => ({
      ...pre,
      [index]: value,
    }));
  };
  const handleSubmit = (item, index) => {
    setResults((prev) => ({
      ...prev,
      [index]: item.answers === userAnswers[index],
    }));
    setSubmit((pre) => ({
      ...pre,
      [index]: true,
    }));
    setTimeout(() => {
      videoRef.current.play();
    }, 1000);
  };
  return (
    <div className="video-container">
      <h3>{card?.tenBoThe}</h3>

      <video
        ref={videoRef}
        src={video?.src}
        className="video-element"
        controls
        autoPlay
      />

      <div className="transcript">
        <h4>Transcript</h4>
        {video?.transcript?.map((item, index) => (
          <div className="transcript-item" key={index}>
            <span>Đoạn {item.t} giây có đáp án là</span>
            <input
              ref={(ref) => (inputRef.current[index] = ref)}
              className="answers"
              value={userAnswers[index]}
              onChange={(e) => handleAnswers(index, e.target.value)}
            />
            <button
              className="submit"
              onClick={() => handleSubmit(item, index)}
            >
              Nộp
            </button>
            {submit[index] &&
              (results[index] ? (
                <span className="result correct">
                  <FontAwesomeIcon icon={faCircleCheck} /> Đúng
                </span>
              ) : (
                <span className="result wrong">
                  <FontAwesomeIcon icon={faCircleXmark} /> Sai
                </span>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
export default Video;
