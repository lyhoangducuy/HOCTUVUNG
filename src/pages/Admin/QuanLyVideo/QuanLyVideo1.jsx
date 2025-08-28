import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";

// Giả sử các service và component con được import đúng
import { getAllVideos, deleteVideo } from "../../../services/videoService";
import VideoForm from "./VideoForm";
import VideoDetail from "./VideoDetail";
import "./QuanLyVideo.css";

// Custom hook để debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};


export default function QuanLyVideo1() {
  // === STATE MANAGEMENT ===
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Sử dụng debounce cho giá trị search
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // === DATA FETCHING ===
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllVideos();
      setVideos(data);
    } catch (err) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // === DERIVED STATE & FILTERING/SORTING with useMemo ===
  const displayedVideos = useMemo(() => {
    let filtered = [...videos];

    // Lọc theo từ khóa tìm kiếm
    if (debouncedSearchTerm) {
      filtered = filtered.filter(video =>
        video.tenBoThe.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Sắp xếp
    if (sortBy === "newest") {
      filtered.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.tenBoThe.localeCompare(b.tenBoThe));
    }

    return filtered;
  }, [videos, debouncedSearchTerm, sortBy]);


  // === EVENT HANDLERS ===
  const handleDeleteVideo = async (lessonId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài học này không?")) {
      try {
        await deleteVideo(lessonId);
        alert("Xóa thành công!");
        // Cập nhật lại danh sách sau khi xóa
        setVideos(prev => prev.filter(video => video.id !== lessonId));
      } catch (err) {
        alert("Xóa thất bại. Vui lòng thử lại.");
        console.error(err);
      }
    }
  };

  const handleAddVideo = () => { setEditingVideo(null); setShowForm(true); };
  const handleEditVideo = (video) => { setEditingVideo(video); setShowForm(true); };
  const handleViewDetail = (video) => { setSelectedVideo(video); setShowDetail(true); };
  
  const handleFormSuccess = () => { setShowForm(false); loadVideos(); };
  const handleFormClose = () => setShowForm(false);
  const handleDetailClose = () => setShowDetail(false);


  // === RENDER LOGIC ===
  const renderContent = () => {
    if (loading) return <div className="status-message">Đang tải danh sách video...</div>;
    if (error) return <div className="status-message error">{error}</div>;
    if (videos.length === 0) return <div className="status-message">Chưa có bài học nào. Hãy thêm bài học mới!</div>;
    if (displayedVideos.length === 0) return <div className="status-message">Không tìm thấy kết quả phù hợp.</div>;

    return (
      <table className="video-table">
        {/* ... JSX cho table header ... */}
        <tbody>
          {displayedVideos.map((video) => (
            <tr key={video.id}>
              <td>{video.tenBoThe}</td>
              <td>{video.moTa?.substring(0, 50)}...</td>
              <td>{video.createdAt?.toDate().toLocaleDateString()}</td>
              <td>
                <div className="action-buttons">
                  <button onClick={() => handleViewDetail(video)} className="action-button view" title="Xem chi tiết"><FontAwesomeIcon icon={faEye} /></button>
                  <button onClick={() => handleEditVideo(video)} className="action-button edit" title="Chỉnh sửa"><FontAwesomeIcon icon={faEdit} /></button>
                  <button onClick={() => handleDeleteVideo(video.id)} className="action-button delete" title="Xóa"><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="admin-video-container">
      <div className="admin-header">
        <h1>Quản lý bài học video</h1>
        <button className="admin-header-button" onClick={handleAddVideo}>
          <FontAwesomeIcon icon={faPlus} /> Thêm bài học mới
        </button>
      </div>
      
      <div className="admin-controls">
        <div className="search-bar">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="name">Theo tên (A-Z)</option>
        </select>
      </div>

      <div className="video-table-container">
        {renderContent()}
      </div>

      {showForm && <VideoForm video={editingVideo} onClose={handleFormClose} onSuccess={handleFormSuccess} />}
      {showDetail && <VideoDetail video={selectedVideo} onClose={handleDetailClose} />}
    </div>
  );
}