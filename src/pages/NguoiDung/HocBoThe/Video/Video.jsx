import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faArrowLeft,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import "./Video.css";
import { getVideoById } from "../../../../services/videoService";

function Video() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [video, setVideo] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState({});
  const [submit, setSubmit] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const inputRef = useRef([]);

  // Load dữ liệu video
  useEffect(() => {
    const loadVideoData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (id) {
          const data = await getVideoById(id);

          const cardData = {
            tenBoThe: data.tenBoThe,
            moTa: data.moTa,
          };

          const videoData = {
            src: data.src || data.videoUrl || data.url || "",
            transcript: Array.isArray(data.transcript) ? data.transcript : [],
          };

          if (!videoData.src) {
            throw new Error("Thiếu nguồn video (src) trong dữ liệu Firestore");
          }

          setCard(cardData);
          setVideo(videoData);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu video:", err);
        setError(err.message || "Lỗi khi tải dữ liệu bài học");
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [id]);

  // Xử lý transcript khi phát video
  useEffect(() => {
    if (!video?.transcript || !videoRef.current) return;

    const videoElement = videoRef.current;

    const handleTimeUpdate = () => {
      const index = video.transcript.findIndex(
        (item, i) =>
          !submit[i] && Math.abs(videoElement.currentTime - item.t) < 0.5
      );

      if (index !== -1) {
        videoElement.pause();
        setTimeout(() => {
          inputRef.current[index]?.focus();
        }, 100);
      }
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [video, submit]);

  const handleAnswers = (index, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const handleSubmit = (item, index) => {
    if (!userAnswers[index] || userAnswers[index].trim() === "") {
      alert("Vui lòng nhập câu trả lời trước khi nộp!");
      return;
    }

    const isCorrect =
      item.answers.toLowerCase().trim() ===
      userAnswers[index].toLowerCase().trim();

    setResults((prev) => ({
      ...prev,
      [index]: isCorrect,
    }));

    setSubmit((prev) => ({
      ...prev,
      [index]: true,
    }));

    setTimeout(() => {
      videoRef.current?.play();
    }, 500);
  };

  const handleRetry = (index) => {
    setSubmit((prev) => ({ ...prev, [index]: false }));
    setResults((prev) => ({ ...prev, [index]: undefined }));
    setUserAnswers((prev) => ({ ...prev, [index]: "" }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render UI
  if (loading) {
    return (
      <div className="video-container">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="loading-spinner"></div>
          <p>Đang tải bài học video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-container">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{ fontSize: "48px", color: "#ef4444", marginBottom: "16px" }}
          />
          <h3>Không thể tải bài học</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>{error}</p>
          <button
            onClick={() => navigate("/video")}
            style={{
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Quay lại thư viện
          </button>
        </div>
      </div>
    );
  }

  if (!card || !video) {
    return (
      <div className="video-container">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h3>Không tìm thấy bài học</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            Bài học video không tồn tại hoặc đã bị xóa
          </p>
          <button
            onClick={() => navigate("/video")}
            style={{
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Quay lại thư viện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-container">
      {/* Header */}
      <div className="video-header">
        <button
          onClick={() => navigate("/video")}
          className="back-button"
          title="Quay lại thư viện"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h3>{card.tenBoThe}</h3>
        {card.moTa && <p className="video-description">{card.moTa}</p>}
      </div>

      {/* Video Player */}
      <div className="video-player-section">
        {video?.src ? (
          <video
            ref={videoRef}
            src={video.src}
            className="video-element"
            controls
            preload="metadata"
            onError={(e) => {
              console.error("Lỗi video:", e);
              setError("Không thể phát video. Vui lòng kiểm tra đường dẫn video.");
            }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p style={{ color: "#6b7280" }}>Chưa có nguồn video hợp lệ.</p>
          </div>
        )}
      </div>

      {/* Transcript Section */}
      <div className="transcript-section">
        <div className="transcript-header">
          <h4>Bài tập Transcript</h4>
          <p>Điền từ còn thiếu khi video dừng lại</p>
        </div>

        {video.transcript?.length > 0 ? (
          <div className="transcript-list">
            {video.transcript.map((item, index) => (
              <div
                key={index}
                className={`transcript-item ${submit[index] ? "completed" : ""}`}
              >
                <div className="transcript-item-header">
                  <span className="transcript-number">#{index + 1}</span>
                  <span className="transcript-time">{formatTime(item.t)}s</span>
                  {submit[index] && (
                    <span
                      className={`result ${results[index] ? "correct" : "wrong"}`}
                    >
                      <FontAwesomeIcon
                        icon={results[index] ? faCircleCheck : faCircleXmark}
                      />
                      {results[index] ? "Đúng" : "Sai"}
                    </span>
                  )}
                </div>

                <div className="transcript-content">
                  {!submit[index] ? (
                    <div className="answer-input-group">
                      <input
                        ref={(ref) => (inputRef.current[index] = ref)}
                        className="answer-input"
                        value={userAnswers[index] || ""}
                        onChange={(e) => handleAnswers(index, e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSubmit(item, index);
                          }
                        }}
                      />
                      <button
                        className="submit-btn"
                        onClick={() => handleSubmit(item, index)}
                        disabled={!userAnswers[index]?.trim()}
                      >
                        Nộp
                      </button>
                    </div>
                  ) : (
                    <div className="answer-result">
                      <p>
                        <strong>Đáp án của bạn:</strong> {userAnswers[index]}
                      </p>
                      <p>
                        <strong>Đáp án đúng:</strong> {item.answers}
                      </p>
                      <button
                        className="retry-btn"
                        onClick={() => handleRetry(index)}
                      >
                        Thử lại
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-transcript">
            <p>Bài học này chưa có transcript. Vui lòng liên hệ admin để thêm nội dung.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Video;
