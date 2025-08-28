import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faClock, faFileAlt, faBook } from "@fortawesome/free-solid-svg-icons";

// 1. Import file CSS mới
import './VideoDetail.css';

export default function VideoDetail({ video, onClose }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!video) return null; // Tránh lỗi nếu không có video

  return (
    // 2. Sử dụng các className mới
    <div className="video-detail-overlay">
      <div className="video-detail-container">
        {/* Header */}
        <div className="detail-header">
          <h2>Chi Tiết Video</h2>
          <button onClick={onClose} className="close-button">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="detail-content">
          
          {/* Video Preview */}
          <div className="video-player-wrapper">
            <video src={video.videoUrl} controls className="video-player" />
          </div>

          {/* Info Section */}
          <div className="detail-section">
            <h3>Thông tin bài học</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-item-label">
                  <FontAwesomeIcon icon={faBook} />
                  <span>Tiêu đề</span>
                </div>
                <p className="info-item-value">{video.tenBoThe}</p>
              </div>
              <div className="info-item">
                <div className="info-item-label">
                  <FontAwesomeIcon icon={faFileAlt} />
                  <span>Mô tả</span>
                </div>
                <p className="info-item-value">{video.moTa || "Không có mô tả"}</p>
              </div>
              <div className="info-item">
                <div className="info-item-label">
                  <FontAwesomeIcon icon={faClock} />
                  <span>Ngày tạo</span>
                </div>
                <p className="info-item-value">
                  {video.createdAt?.toDate().toLocaleDateString('vi-VN') || "Không rõ"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Transcript Section */}
          <div className="detail-section">
            <h3>Transcript tương tác</h3>
            {video.transcript && video.transcript.length > 0 ? (
              <div className="transcript-list-detail">
                {video.transcript.map((item, index) => (
                  <div key={index} className="transcript-item-detail">
                    <span className="transcript-item-time">{formatTime(item.t)}</span>
                    <p className="transcript-item-answer">{item.answers}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Bài học này chưa có transcript.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="detail-footer">
          <button onClick={onClose} className="btn-close">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}