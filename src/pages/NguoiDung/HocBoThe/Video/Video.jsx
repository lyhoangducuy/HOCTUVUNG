import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEllipsisH,
  faCircleCheck,
  faCircleXmark,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

import { getVideoById, deleteVideo } from "../../../../services/videoService";
import "./Video.css";

function Video() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [owner, setOwner] = useState(false);
  // --- PHẦN STATE ---
  // Không thay đổi
  const [card, setCard] = useState(null);
  const [videoData, setVideoData] = useState(null); // Đổi tên `video` thành `videoData` để rõ ràng hơn
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState({});
  const [submit, setSubmit] = useState({});
  const videoRef = useRef(null);
  const inputRef = useRef([]);
  const session = JSON.parse(sessionStorage.getItem("session") || "null");
  const uid = session?.idNguoiDung || null;
  if (!uid) {
    navigate("/dang-nhap");
  }
  // --- PHẦN LẤY DỮ LIỆU ---
  useEffect(() => {
    // Chỉ chạy khi `id` tồn tại
    if (!id) {
        setError("Không tìm thấy ID bài học.");
        setLoading(false);
        return;
    }


    const loadVideoData = async () => {
      try {
        // Reset tất cả state trước mỗi lần tải dữ liệu mới
        setLoading(true);
        setError(null);
        setCard(null);
        setVideoData(null);

        const lessonData = await getVideoById(id);
        if (lessonData && lessonData.idNguoiDung === uid) {
          setOwner(true);
        }
        if (lessonData && lessonData.videoUrl) {
          setCard(lessonData);
          setVideoData({
            src: lessonData.videoUrl,
            transcript: lessonData.transcript || [],
          });
        } else {
          throw new Error("Không tìm thấy dữ liệu cho bài học này.");
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu video:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [id]); // Chỉ phụ thuộc vào `id`

  // --- PHẦN XỬ LÝ VIDEO (ĐÃ SỬA ĐỂ AN TOÀN HƠN) ---
  useEffect(() => {
    const videoElement = videoRef.current;

    // **AN TOÀN HƠN:** Chỉ thêm event listener KHI video element đã tồn tại
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);

    // Hàm dọn dẹp để xóa event listener khi component bị hủy
    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [videoData]); // Chạy lại hiệu ứng này khi `videoData` đã được tải xong

  useEffect(() => {
    const videoElement = videoRef.current;

    // **AN TOÀN HƠN:** Kiểm tra cả video element và dữ liệu transcript
    if (!videoElement || !videoData?.transcript?.length) return;

    videoData.transcript.forEach((item, index) => {
      if (
        !videoElement.paused &&
        currentTime >= item.t &&
        !submit[index]
      ) {
        videoElement.pause();
        if (inputRef.current[index]) {
          inputRef.current[index].focus();
        }
      }
    });
  }, [currentTime, submit, videoData]);


  // --- CÁC HÀM XỬ LÝ SỰ KIỆN (Không thay đổi nhiều) ---
  const handleAnswers = (index, value) => {
    setUserAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = (item, index) => {
    const answer = userAnswers[index];
    if (!answer || answer.trim() === "") {
      alert("Vui lòng nhập câu trả lời!");
      return;
    }
    const isCorrect = item.answers.toLowerCase().trim() === answer.toLowerCase().trim();
    setResults((prev) => ({ ...prev, [index]: isCorrect }));
    setSubmit((prev) => ({ ...prev, [index]: true }));

    // Chỉ thực hiện khi trả lời đúng và video đã được render
    if (isCorrect && videoRef.current) {
      setTimeout(() => {
        videoRef.current.play();
        
        // === DÒNG CODE MỚI THÊM VÀO ===
        // Chuyển focus trở lại thẻ video
        videoRef.current.focus({ preventScroll: false }); 
        // ==============================

      }, 1000); // Giữ delay 1 giây để người dùng xem kết quả
    }
  };

  const handleRetry = (index) => {
    setSubmit((prev) => ({ ...prev, [index]: false }));
    setResults((prev) => ({ ...prev, [index]: undefined }));
    setUserAnswers((prev) => ({ ...prev, [index]: "" }));
    setTimeout(() => {
      if (inputRef.current[index]) {
        inputRef.current[index].focus();
      }
    }, 100);
  };
  
  const formatTime = (seconds) => { /* ... Giữ nguyên ... */ };

  // --- PHẦN RENDER GIAO DIỆN (ĐÃ TỔ CHỨC LẠI CHO CHẮC CHẮN) ---
  if (loading) {
    return <div className="video-status-container">Đang tải bài học...</div>;
  }

  if (error) {
    return <div className="video-status-container error">Lỗi: {error}</div>;
  }
  
  // **ĐIỀU KIỆN BẢO VỆ CUỐI CÙNG:** Ngăn lỗi triệt để
  if (!card || !videoData) {
    return <div className="video-status-container">Không tìm thấy dữ liệu bài học.</div>;
  }
  const doiTrangThaiDropdown = () => setShowDropdown((prev) => !prev);
  const handleDelete = () => {
    const confirmDelete = window.confirm("Bản muốn xóa bài học nây?");
    if (confirmDelete) {
      deleteVideo(id);
    }
  }
  // Nếu qua được các bước trên, card và videoData chắc chắn tồn tại
  return (
    <div className="video-container">
      <div className="video-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h3>{card.tenBoThe}</h3>
        {owner && (
            <div style={{ position: "relative" }}>
              <button className="btn-them" onClick={doiTrangThaiDropdown}>
                <FontAwesomeIcon icon={faEllipsisH} className="icon" />
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  <button onClick={() => { setShowDropdown(false); navigate(`/edit-video/${id}`); }}>
                    Sửa bài học
                  </button>
                  <button onClick={handleDelete}>Xóa bài học</button>
                </div>
              )}
            </div>
          )}
        
      </div>

      <div className="video-player-section">
        <video
          ref={videoRef}
          key={videoData.src} // **QUAN TRỌNG:** Thêm key để React tạo lại thẻ video khi src thay đổi
          src={videoData.src}
          className="video-element"
          controls
          preload="metadata"
        />
      </div>

      <div className="transcript-section">
        <div className="transcript-header">
          <h4>Bài tập Transcript</h4>
        </div>
        
        {videoData.transcript?.length > 0 ? (
          <div className="transcript-list">
            {videoData.transcript.map((item, index) => (
              <div key={index} className={`transcript-item ${submit[index] ? 'completed' : ''}`}>
                <div className="transcript-item-header">
                   <span className="transcript-number">#{index + 1}</span>
                   <span className="transcript-time">{formatTime(item.t)}s</span>
                   {/* ... Phần hiển thị kết quả đúng/sai ... */}
                </div>
                
                <div className="transcript-content">
                  {!submit[index] ? (
                    <div className="answer-input-group">
                      <input
                        ref={(ref) => (inputRef.current[index] = ref)}
                        className="answer-input"
                        value={userAnswers[index] || ""}
                        onChange={(e) => handleAnswers(index, e.target.value)}
                        placeholder="Nhập câu trả lời..."
                        onKeyPress={(e) => { if (e.key === 'Enter') handleSubmit(item, index); }}
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
                      <p><strong>Bạn trả lời:</strong> {userAnswers[index]}</p>
                      <p><strong>Đáp án đúng:</strong> {item.answers}</p>
                      {!results[index] && (
                         <button className="retry-btn" onClick={() => handleRetry(index)}>
                           Thử lại
                         </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-transcript">
            <p>Bài học này chưa có transcript.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Video;