import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import các hàm service của bạn
import { getVideoById,updateVideo } from '../../../../services/videoService'; // Cần tạo hàm này


import './videoupdate.css';

// Lấy thông tin Cloudinary từ biến môi trường
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

function EditVideoLesson() {
  const { id } = useParams(); // Lấy ID bài học từ URL
  const navigate = useNavigate();

  // State để quản lý form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transcripts, setTranscripts] = useState([]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [newVideoFile, setNewVideoFile] = useState(null);

  // State để quản lý giao diện
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  // useEffect để tải dữ liệu của bài học khi component được tạo
  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        const lessonData = await getVideoById(id);
        if (lessonData) {
          setTitle(lessonData.tenBoThe);
          setDescription(lessonData.moTa);
          setTranscripts(lessonData.transcript || []);
          setCurrentVideoUrl(lessonData.videoUrl);
        } else {
          setError("Không tìm thấy bài học.");
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu bài học.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessonData();
  }, [id]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setNewVideoFile(e.target.files[0]);
    }
  };

  const handleTranscriptChange = (index, field, value) => {
    const newTranscripts = [...transcripts];
    newTranscripts[index][field] = field === 't' ? Number(value) : value;
    setTranscripts(newTranscripts);
  };
  
  const handleAddTranscript = () => setTranscripts([...transcripts, { t: 0, answers: '' }]);
  const handleRemoveTranscript = (index) => setTranscripts(transcripts.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    let finalVideoUrl = currentVideoUrl;

    try {
      // 1. Nếu người dùng chọn file video mới -> Tải lên Cloudinary
      if (newVideoFile) {
        const formData = new FormData();
        formData.append('file', newVideoFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await axios.post(CLOUDINARY_API_URL, formData, {
          onUploadProgress: (progressEvent) => {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          },
        });
        finalVideoUrl = response.data.secure_url; // Lấy URL mới
      }

      // 2. Chuẩn bị dữ liệu để cập nhật
      const updatedData = {
        tenBoThe: title,
        moTa: description,
        transcript: transcripts,
        videoUrl: finalVideoUrl,
      };

      // 3. Gọi hàm service để cập nhật vào Firestore
      await updateVideo(id, updatedData);
      
      alert('Cập nhật bài học thành công!');
      navigate(`/video/${id}`); // Chuyển về trang xem video sau khi sửa

    } catch (err) {
      setError("Cập nhật thất bại. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading-container">Đang tải dữ liệu...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="edit-form-container">
      <h2>Sửa bài học video</h2>
      <form onSubmit={handleSubmit}>
        
        {currentVideoUrl && (
          <div className="video-preview-section">
            <h3>Video hiện tại</h3>
            <video src={currentVideoUrl} controls className="video-preview" />
          </div>
        )}

        <div className="form-group">
          <label>Thay đổi video (để trống nếu không muốn thay đổi)</label>
          <input type="file" accept="video/*" onChange={handleFileChange} />
        </div>
        
        <div className="form-group">
          <label>Tiêu đề bài học:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="form-control" />
        </div>

        <div className="form-group">
          <label>Mô tả:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-control" />
        </div>
        
        {/* Phần quản lý Transcript (giữ nguyên logic) */}
        <div className="transcript-section">
          <h3>Transcript tương tác</h3>
          {transcripts.map((item, index) => (
            <div key={index} className="transcript-row">
              <input type="number" value={item.t} onChange={(e) => handleTranscriptChange(index, 't', e.target.value)} className="form-control transcript-time-input" />
              <input type="text" value={item.answers} onChange={(e) => handleTranscriptChange(index, 'answers', e.target.value)} className="form-control transcript-answer-input" />
              <button type="button" onClick={() => handleRemoveTranscript(index)} className="btn btn-remove">Xóa</button>
            </div>
          ))}
          <button type="button" onClick={handleAddTranscript} className="btn btn-add">Thêm dòng</button>
        </div>

        {isSubmitting && uploadProgress > 0 && (
          <div><progress value={uploadProgress} max="100" /></div>
        )}
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" disabled={isSubmitting} className="btn btn-submit" >
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}

export default EditVideoLesson;