import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faCircleCheck,
  faCircleXmark,
  faArrowLeft,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import "./Video.css";

function Video() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [video, setVideo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState({});
  const [submit, setSubmit] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const inputRef = useRef([]);

  useEffect(() => {
    const loadVideoData = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Lấy dữ liệu từ localStorage
        const selected = JSON.parse(localStorage.getItem("selected") || "null");
        const lessonList = JSON.parse(localStorage.getItem("lessonList") || "[]");
        
        if (!selected && id) {
          // Nếu không có selected, tìm trong lessonList
          const foundLesson = lessonList.find(lesson => lesson.id === id);
          if (foundLesson) {
            setCard(foundLesson);
            setVideo(foundLesson.video || null);
          } else {
            setError("Không tìm thấy bài học video");
          }
        } else if (selected) {
          setCard(selected);
          setVideo(selected.video || null);
        } else {
          setError("Không có dữ liệu bài học");
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu video:", err);
        setError("Lỗi khi tải dữ liệu bài học");
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [id]);

  useEffect(() => {
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, []);

  // Xử lý transcript khi thời gian thay đổi
  useEffect(() => {
    if (!video?.transcript || !Array.isArray(video.transcript)) return;
    
    video.transcript.forEach((item, index) => {
      if (Math.abs(currentTime - item.t) < 0.5 && !submit[index]) {
        // Tạm dừng video khi đến thời điểm transcript
        if (videoRef.current) {
          videoRef.current.pause();
        }
        
        // Focus vào input tương ứng
        setTimeout(() => {
          if (inputRef.current[index]) {
            inputRef.current[index].focus();
          }
        }, 100);
      }
    });
  }, [currentTime, submit, video]);

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

    const isCorrect = item.answers.toLowerCase().trim() === userAnswers[index].toLowerCase().trim();
    
    setResults((prev) => ({
      ...prev,
      [index]: isCorrect,
    }));
    
    setSubmit((prev) => ({
      ...prev,
      [index]: true,
    }));

    // Tự động phát video sau 1 giây
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    }, 1000);
  };

  const handleRetry = (index) => {
    setSubmit((prev) => ({
      ...prev,
      [index]: false,
    }));
    setResults((prev) => ({
      ...prev,
      [index]: undefined,
    }));
    setUserAnswers((prev) => ({
      ...prev,
      [index]: "",
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="video-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
          <p>Đang tải bài học video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }} />
          <h3>Không thể tải bài học</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>{error}</p>
          <button 
            onClick={() => navigate('/video')}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
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
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Không tìm thấy bài học</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>Bài học video không tồn tại hoặc đã bị xóa</p>
          <button 
            onClick={() => navigate('/video')}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
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
          onClick={() => navigate('/video')}
          className="back-button"
          title="Quay lại thư viện"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h3>{card.tenBoThe}</h3>
        {card.moTa && (
          <p className="video-description">{card.moTa}</p>
        )}
      </div>

      {/* Video Player */}
      <div className="video-player-section">
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
      </div>

      {/* Transcript Section */}
      <div className="transcript-section">
        <div className="transcript-header">
          <h4>Bài tập Transcript</h4>
          <p>Điền từ còn thiếu khi video dừng lại</p>
        </div>

        {video.transcript && Array.isArray(video.transcript) && video.transcript.length > 0 ? (
          <div className="transcript-list">
            {video.transcript.map((item, index) => (
              <div key={index} className={`transcript-item ${submit[index] ? 'completed' : ''}`}>
                <div className="transcript-item-header">
                  <span className="transcript-number">#{index + 1}</span>
                  <span className="transcript-time">{formatTime(item.t)}s</span>
                  {submit[index] && (
                    <span className={`result ${results[index] ? 'correct' : 'wrong'}`}>
                      <FontAwesomeIcon icon={results[index] ? faCircleCheck : faCircleXmark} />
                      {results[index] ? 'Đúng' : 'Sai'}
                    </span>
                  )}
                </div>
                
                <div className="transcript-content">
                  <p className="transcript-question">
                    Đoạn {formatTime(item.t)} giây có đáp án là: <strong>{item.answers}</strong>
                  </p>
                  
                  {!submit[index] ? (
                    <div className="answer-input-group">
                      <input
                        ref={(ref) => (inputRef.current[index] = ref)}
                        className="answer-input"
                        value={userAnswers[index] || ""}
                        onChange={(e) => handleAnswers(index, e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSubmit(item, index);
                          }
                        }}
                      />
                      <button
                        className="submit-btn"
                        onClick={() => handleSubmit(item, index)}
                        disabled={!userAnswers[index] || userAnswers[index].trim() === ""}
                      >
                        Nộp
                      </button>
                    </div>
                  ) : (
                    <div className="answer-result">
                      <p><strong>Đáp án của bạn:</strong> {userAnswers[index]}</p>
                      <p><strong>Đáp án đúng:</strong> {item.answers}</p>
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
