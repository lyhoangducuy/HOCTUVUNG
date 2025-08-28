import { useState } from 'react';
import axios from 'axios';
import { addVideo } from "../../../../services/videoService";
import './videouploadform.css';
import { useNavigate } from 'react-router-dom';
// Lấy thông tin từ biến môi trường
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;


function VideoUploadForm() {
    const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const session = JSON.parse(sessionStorage.getItem("session") || "null");
    const uid = auth.currentUser?.uid || session?.idNguoiDung || null;
  // State để quản lý danh sách transcript
  const [transcripts, setTranscripts] = useState([{ t: 0, answers: '' }]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  // --- HÀM XỬ LÝ TRANSCRIPT ---

  // Thêm một dòng transcript mới
  const handleAddTranscript = () => {
    setTranscripts([...transcripts, { t: 0, answers: '' }]);
  };

  // Xóa một dòng transcript
  const handleRemoveTranscript = (indexToRemove) => {
    setTranscripts(transcripts.filter((_, index) => index !== indexToRemove));
  };

  // Cập nhật giá trị cho một dòng transcript
  const handleTranscriptChange = (index, field, value) => {
    const newTranscripts = [...transcripts];
    // Chuyển đổi thời gian sang kiểu số
    newTranscripts[index][field] = field === 't' ? Number(value) : value;
    setTranscripts(newTranscripts);
  };

  // --- KẾT THÚC HÀM XỬ LÝ TRANSCRIPT ---


  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... logic upload và lưu trữ giữ nguyên như trước ...
    
    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_API_URL, formData, {
        onUploadProgress: (progressEvent) => {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });

      const videoUrl = response.data.secure_url;
      
      // Lưu thông tin bài học (bao gồm cả transcripts) vào Firestore
      await saveLessonToFirestore(title, description, videoUrl, transcripts);
      alert('Đã tạo bài học mới thành công!');

      // Reset form
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setTranscripts([{ t: 0, answers: '' }]);
      navigate('/video');
    } catch (err) {
      console.error("Lỗi khi upload video:", err);
      setError("Upload thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveLessonToFirestore = async (lessonTitle, lessonDesc, lessonVideoUrl, lessonTranscripts) => {
    try {
      const lessonData = {
        idNguoiDung: uid,
        tenBoThe: lessonTitle,
        moTa: lessonDesc,
        videoUrl: lessonVideoUrl,
        transcript: lessonTranscripts, // Lưu mảng transcript
      };
      await addVideo(lessonData);
    } catch (error) {
      console.error("Lỗi khi lưu vào Firestore:", error);
    }
  };


  return (
    <div className="video-form-container">
      <h2>Tải lên bài học video mới</h2>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label>Tiêu đề bài học:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="form-control" />
        </div>
        <div className="form-group">
          <label>Mô tả:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-control" />
        </div>
        <div className="form-group">
          <label>Chọn file video:</label>
          <input type="file" accept="video/*" onChange={handleFileChange} required />
        </div>

        <div className="transcript-section">
            <h3>Transcript tương tác</h3>
            {transcripts.map((item, index) => (
                <div key={index} className="transcript-row">
                    <input 
                        type="number" 
                        placeholder="Thời gian (giây)"
                        value={item.t}
                        onChange={(e) => handleTranscriptChange(index, 't', e.target.value)}
                        className="transcript-time-input"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Đáp án đúng"
                        value={item.answers}
                        onChange={(e) => handleTranscriptChange(index, 'answers', e.target.value)}
                        className="transcript-answer-input"
                        required
                    />
                    <button 
                        type="button" 
                        onClick={() => handleRemoveTranscript(index)}
                        className="btn btn-remove"
                    >
                        Xóa
                    </button>
                </div>
            ))}
            <button 
                type="button" 
                onClick={handleAddTranscript}
                className="btn btn-add"
            >
                Thêm dòng
            </button>
        </div>
        
        {isUploading && (
          <div className="progress-wrapper">
            <p>Đang tải lên: {uploadProgress}%</p>
            <progress value={uploadProgress} max="100" />
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" disabled={isUploading} className="btn btn-submit">
          {isUploading ? 'Đang tải...' : 'Lưu bài học'}
        </button>
      </form>
    </div>
  );
}

export default VideoUploadForm;