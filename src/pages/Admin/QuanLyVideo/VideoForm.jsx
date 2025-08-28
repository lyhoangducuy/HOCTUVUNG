import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faPlus, 
  faTrash, 
  faSave,
  faVideo,
  faFileAlt,
  faClock,
  faExclamationTriangle,
  faEdit,
  faUpload
} from "@fortawesome/free-solid-svg-icons";
import { addVideo, updateVideo } from "../../../services/videoService";
import { storage } from "../../../../lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import "./VideoForm.css";

export default function VideoForm({ video, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    tenBoThe: "",
    moTa: "",
    video: {
      src: "",
      transcript: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedFile, setSelectedFile] = useState(null);

  const isEditing = !!video;

  useEffect(() => {
    if (video) {
      setFormData({
        tenBoThe: video.tenBoThe || "",
        moTa: video.moTa || "",
        video: {
          src: video?.videoUrl || "",
          transcript: video?.transcript || []
        }
      });
    }
  }, [video]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tenBoThe.trim()) {
      newErrors.tenBoThe = "Tên bộ thẻ không được để trống";
    }

    if (!formData.moTa.trim()) {
      newErrors.moTa = "Mô tả không được để trống";
    }

    if (!formData.video.src.trim() && !selectedFile) {
      newErrors.video = "Đường dẫn video hoặc file video không được để trống";
    }

    if (formData.video.transcript.length === 0) {
      newErrors.transcript = "Phải có ít nhất 1 câu transcript";
    }

    // Validate transcript entries
    formData.video.transcript.forEach((item, index) => {
      if (!item.answers.trim()) {
        newErrors[`transcript_${index}`] = "Nội dung câu không được để trống";
      }
      if (item.t < 0) {
        newErrors[`time_${index}`] = "Thời gian không được âm";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Chuẩn bị dữ liệu lưu
      let payload = { ...formData };

      // Nếu admin chọn file, upload lên Firebase Storage trước
      if (selectedFile) {
        try {
          const path = `videos/${Date.now()}_${selectedFile.name}`;
          const fileRef = storageRef(storage, path);
          await uploadBytes(fileRef, selectedFile);
          const downloadURL = await getDownloadURL(fileRef);
          payload = {
            ...payload,
            video: {
              ...payload.video,
              src: downloadURL,
              storagePath: path,
            },
          };
        } catch (uploadErr) {
          console.error("Upload video thất bại:", uploadErr);
          throw new Error("Không thể tải video lên Firebase Storage. Vui lòng thử lại.");
        }
      }

      if (isEditing) {
        await updateVideo(video.id, payload);
      } else {
        await addVideo(payload);
      }

      onSuccess();
    } catch (error) {
      console.error("Lỗi khi lưu video:", error);
      alert(error.message || "Có lỗi xảy ra khi lưu video!");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handleVideoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      video: {
        ...prev.video,
        [field]: value
      }
    }));

    if (errors.video) {
      setErrors(prev => ({
        ...prev,
        video: ""
      }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        video: {
          ...prev.video,
          src: URL.createObjectURL(file)
        }
      }));
      if (errors.video) {
        setErrors(prev => ({
          ...prev,
          video: ""
        }));
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      video: {
        ...prev.video,
        src: ""
      }
    }));
    if (errors.video) {
      setErrors(prev => ({
        ...prev,
        video: ""
      }));
    }
  };

  const addTranscript = () => {
    setFormData(prev => ({
      ...prev,
      video: {
        ...prev.video,
        transcript: [
          ...prev.video.transcript,
          { t: 0, answers: "" }
        ]
      }
    }));

    if (errors.transcript) {
      setErrors(prev => ({
        ...prev,
        transcript: ""
      }));
    }
  };

  const removeTranscript = (index) => {
    setFormData(prev => ({
      ...prev,
      video: {
        ...prev.video,
        transcript: prev.video.transcript.filter((_, i) => i !== index)
      }
    }));
  };

  const updateTranscript = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      video: {
        ...prev.video,
        transcript: prev.video.transcript.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));

    // Clear specific error
    if (errors[`transcript_${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`transcript_${index}`]: ""
      }));
    }
    if (errors[`time_${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`time_${index}`]: ""
      }));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (formData.video.transcript.length === 0) return 0;
    return Math.max(...formData.video.transcript.map(t => t.t));
  };

  return (
    <div className="video-form-overlay">
      <div className="video-form-container">
        {/* Header */}
        <div className="form-header">
          <div className="form-header-content">
            <div className="form-header-icon">
              <FontAwesomeIcon icon={isEditing ? faEdit : faPlus} />
            </div>
            <div className="form-header-text">
              <h2>{isEditing ? "Chỉnh sửa Video" : "Thêm Video Mới"}</h2>
              <p>{isEditing ? "Cập nhật thông tin video" : "Tạo video bài học mới"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="form-close-button"
            title="Đóng form"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="form-content">
          {/* Tab Navigation */}
          <div className="form-tabs">
            <button
              type="button"
              className={`form-tab ${activeTab === "basic" ? "active" : ""}`}
              onClick={() => setActiveTab("basic")}
            >
              <FontAwesomeIcon icon={faFileAlt} />
              Thông Tin Cơ Bản
            </button>
            <button
              type="button"
              className={`form-tab ${activeTab === "transcript" ? "active" : ""}`}
              onClick={() => setActiveTab("transcript")}
            >
              <FontAwesomeIcon icon={faClock} />
              Transcript ({formData.video.transcript.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === "basic" && (
              <div className="basic-info-tab">
                <div className="form-grid">
                  {/* Tên Bộ Thẻ */}
                  <div className="form-field">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faFileAlt} />
                      Tên Bộ Thẻ *
                    </label>
                    <input
                      type="text"
                      value={formData.tenBoThe}
                      onChange={(e) => handleInputChange("tenBoThe", e.target.value)}
                      className={`form-input ${errors.tenBoThe ? "error" : ""}`}
                      placeholder="Nhập tên bộ thẻ..."
                    />
                    {errors.tenBoThe && (
                      <div className="error-message">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        {errors.tenBoThe}
                      </div>
                    )}
                  </div>

                  {/* Mô Tả */}
                  <div className="form-field full-width">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faFileAlt} />
                      Mô Tả *
                    </label>
                    <textarea
                      value={formData.moTa}
                      onChange={(e) => handleInputChange("moTa", e.target.value)}
                      rows={4}
                      className={`form-textarea ${errors.moTa ? "error" : ""}`}
                      placeholder="Nhập mô tả chi tiết về video..."
                    />
                    {errors.moTa && (
                      <div className="error-message">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        {errors.moTa}
                      </div>
                    )}
                  </div>

                  {/* Đường Dẫn Video */}
                  <div className="form-field full-width">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faVideo} />
                      Đường Dẫn Video *
                    </label>
                                         <div className="video-url-input">
                       <input
                         type="text"
                         value={formData.video.src}
                         onChange={(e) => handleVideoChange("src", e.target.value)}
                         className={`form-input ${errors.video ? "error" : ""}`}
                         placeholder="Nhập đường dẫn video (URL hoặc đường dẫn local)..."
                       />
                       
                     </div>
                    
                    {/* File Upload Section */}
                    <div className="video-upload-section">
                      <div className="upload-divider">
                        <span>hoặc</span>
                      </div>
                      <div className="file-upload-area">
                        <input
                          type="file"
                          id="video-file-upload"
                          accept="video/*"
                          onChange={handleFileUpload}
                          className="file-input"
                        />
                        <label htmlFor="video-file-upload" className="file-upload-label">
                          <FontAwesomeIcon icon={faUpload} />
                          <span>Chọn File Video từ Máy</span>
                          <small>Hỗ trợ: MP4, AVI, MOV, MKV</small>
                        </label>
                      </div>
                      {selectedFile && (
                        <div className="selected-file-info">
                          <FontAwesomeIcon icon={faVideo} />
                          <span>{selectedFile.name}</span>
                          <button
                            type="button"
                            onClick={clearSelectedFile}
                            className="clear-file-btn"
                            title="Xóa file đã chọn"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {errors.video && (
                      <div className="error-message">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        {errors.video}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "transcript" && (
              <div className="transcript-tab">
                <div className="transcript-header">
                  <div className="transcript-info">
                    <h3>Quản Lý Transcript</h3>
                   
                  </div>
                  <div className="transcript-stats">
                    <div className="stat-item">
                      <span className="stat-label">Tổng câu:</span>
                      <span className="stat-value">{formData.video.transcript.length}</span>
                    </div>
                   
                  </div>
                </div>

                {errors.transcript && (
                  <div className="error-banner">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {errors.transcript}
                  </div>
                )}

                <div className="transcript-list">
                  {formData.video.transcript.map((item, index) => (
                    <div key={index} className="transcript-item">
                      <div className="transcript-item-header">
                        <span className="transcript-number">#{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeTranscript(index)}
                          className="remove-transcript-btn"
                          title="Xóa câu này"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                      
                      <div className="transcript-inputs">
                        <div className="time-input-group">
                          <label className="time-label">Thời gian (giây)</label>
                          <input
                            type="number"
                            value={item.t}
                            onChange={(e) => updateTranscript(index, "t", parseInt(e.target.value) || 0)}
                            className={`time-input ${errors[`time_${index}`] ? "error" : ""}`}
                            placeholder="0"
                            min="0"
                          />
                         
                        </div>
                        
                        <div className="content-input-group">
                          <label className="content-label">Nội dung câu</label>
                          <textarea
                            value={item.answers}
                            onChange={(e) => updateTranscript(index, "answers", e.target.value)}
                            className={`content-input ${errors[`transcript_${index}`] ? "error" : ""}`}
                            placeholder="Nhập nội dung câu transcript..."
                            
                          />
                        </div>
                      </div>

                      {(errors[`transcript_${index}`] || errors[`time_${index}`]) && (
                        <div className="item-error-message">
                          {errors[`transcript_${index}`] && (
                            <span>{errors[`transcript_${index}`]}</span>
                          )}
                          {errors[`time_${index}`] && (
                            <span>{errors[`time_${index}`]}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {formData.video.transcript.length === 0 && (
                  <div className="empty-transcript">
                    <div className="empty-icon">📝</div>
                    <h4>Chưa có transcript nào</h4>
                    <p>Hãy thêm ít nhất 1 câu transcript để hoàn thành video</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={addTranscript}
                  className="add-transcript-btn"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Thêm Câu Transcript
                </button>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <div className="form-actions-left">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Hủy
              </button>
            </div>
            
            <div className="form-actions-right">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} />
                    {isEditing ? "Cập nhật" : "Thêm Video"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
