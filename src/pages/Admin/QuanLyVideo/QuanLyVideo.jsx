import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faEye,
  faSearch,
  faTimes,
  faFilter,
  faSort,
  faDownload,
  faUpload
} from "@fortawesome/free-solid-svg-icons";
import { getAllVideos, deleteVideo } from "../../../services/videoService";
import VideoForm from "./VideoForm";
import VideoDetail from "./VideoDetail";
import "./QuanLyVideo.css";

export default function QuanLyVideo() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    let filtered = videos;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.tenBoThe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.moTa.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply additional filters
    if (activeFilter === "withTranscript") {
      filtered = filtered.filter(video => video?.transcript?.length > 0);
    } else if (activeFilter === "noTranscript") {
      filtered = filtered.filter(video => !video?.transcript || video.transcript.length === 0);
    }
    
    // Sort videos
    if (sortBy === "newest") {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
    } else if (sortBy === "oldest") {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateA - dateB;
      });
    } else if (sortBy === "name") {
      filtered = [...filtered].sort((a, b) => a.tenBoThe.localeCompare(b.tenBoThe));
    }
    
    setFilteredVideos(filtered);
  }, [searchTerm, videos, activeFilter, sortBy]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await getAllVideos();
      setVideos(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách video:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = () => {
    setEditingVideo(null);
    setShowForm(true);
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video);
    setShowForm(true);
  };

  const handleViewVideo = (video) => {
    setSelectedVideo(video);
    setShowDetail(true);
  };

  const handleDeleteVideo = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa video này?")) {
      try {
        await deleteVideo(id);
        await loadVideos();
        alert("Xóa video thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa video:", error);
        alert("Có lỗi xảy ra khi xóa video!");
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingVideo(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVideo(null);
    loadVideos();
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setSelectedVideo(null);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  const getTotalTranscripts = () => {
    return videos.reduce((total, video) => total + (video?.transcript.length || 0), 0);
  };

  const getAverageTranscripts = () => {
    if (videos.length === 0) return 0;
    return Math.round(getTotalTranscripts() / videos.length);
  };

  if (loading) {
    return (
      <div className="admin-video-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-video-container">
      <div className="admin-video-content">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-header-text">
              <h1>Quản lý Video</h1>
              <p>Quản lý thư viện video bài học</p>
            </div>
            <button
              onClick={handleAddVideo}
              className="admin-header-button flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Thêm Video Mới
            </button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="admin-main-grid">
          {/* Sidebar */}
          <div className="admin-sidebar">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Thống Kê Video</h3>
              <p className="sidebar-subtitle">Tổng quan hệ thống</p>
            </div>

            <div className="sidebar-stats">
              <div className="stat-card">
                <div className="stat-number">{videos.length}</div>
                <div className="stat-label">Tổng Video</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{getTotalTranscripts()}</div>
                <div className="stat-label">Tổng Transcript</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{getAverageTranscripts()}</div>
                <div className="stat-label">TB Transcript/Video</div>
              </div>
            </div>

            <div className="sidebar-actions">
              <button
                onClick={handleAddVideo}
                className="sidebar-button"
              >
                <FontAwesomeIcon icon={faPlus} />
                Thêm Video Mới
              </button>
            </div>

            
          </div>

          {/* Main Content */}
          <div className="admin-main-content">
            {/* Search & Filters */}
            <div className="search-filters-section">
              <div className="search-container">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="search-icon" 
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm video theo tên hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="clear-search"
                    title="Xóa tìm kiếm"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>

              <div className="filter-buttons">
                <button
                  className={`filter-button ${activeFilter === "all" ? "active" : ""}`}
                  onClick={() => handleFilterChange("all")}
                >
                  <FontAwesomeIcon icon={faFilter} />
                  Tất cả
                </button>
                
                <button
                  className={`filter-button ${sortBy === "newest" ? "active" : ""}`}
                  onClick={() => handleSortChange("newest")}
                >
                  <FontAwesomeIcon icon={faSort} />
                  Mới nhất
                </button>
                <button
                  className={`filter-button ${sortBy === "oldest" ? "active" : ""}`}
                  onClick={() => handleSortChange("oldest")}
                >
                  <FontAwesomeIcon icon={faSort} />
                  Cũ nhất
                </button>
                <button
                  className={`filter-button ${sortBy === "name" ? "active" : ""}`}
                  onClick={() => handleSortChange("name")}
                >
                  <FontAwesomeIcon icon={faSort} />
                  Theo tên
                </button>
              </div>
            </div>

            {/* Video List */}
            <div className="video-list-section">
              <div className="video-list-header">
                <h2 className="video-list-title">
                  Danh sách Video 
                  <span className="video-count">{filteredVideos.length}</span>
                </h2>
                
              </div>
              
              {filteredVideos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📹</div>
                  <h3 className="empty-state-title">
                    {searchTerm ? "Không tìm thấy video nào" : "Chưa có video nào"}
                  </h3>
                  <p className="empty-state-description">
                    {searchTerm 
                      ? "Thử thay đổi từ khóa tìm kiếm" 
                      : "Bắt đầu bằng cách thêm video đầu tiên"
                    }
                  </p>
                </div>
              ) : (
                <div className="video-table-container">
                  <table className="video-table">
                    <thead>
                      <tr>
                        <th>Video</th>
                        <th>id Người Tạo</th>
                        <th>Tên Bộ Thẻ</th>
                        <th>Mô Tả</th>
                        <th>Transcript</th>
                        <th>Ngày Tạo</th>
                        <th>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVideos.map((video) => (
                        <tr key={video.id}>
                          <td>
                            <div className="video-thumbnail">
                              <span>VIDEO</span>
                            </div>
                          </td>
                          <td>
                            <div className="font-medium text-gray-900">
                              {video.idNguoiDung}
                            </div>
                          </td>
                          <td>
                            <div className="font-medium text-gray-900">
                              {video.tenBoThe}
                            </div>
                          </td>
                          <td>
                            <div className="text-gray-900 max-w-xs truncate">
                              {video.moTa}
                            </div>
                          </td>
                          <td>
                            <div className="text-gray-900">
                              {video?.transcript?.length || 0} câu
                            </div>
                          </td>
                          <td>
                            <div className="text-gray-900">
                              {video.createdAt?.toDate ? 
                                video.createdAt.toDate().toLocaleDateString('vi-VN') : 
                                'N/A'
                              }
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleViewVideo(video)}
                                className="action-button view"
                                title="Xem chi tiết"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button
                                onClick={() => handleEditVideo(video)}
                                className="action-button edit"
                                title="Chỉnh sửa"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(video.id)}
                                className="action-button delete"
                                title="Xóa"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Form Modal */}
      {showForm && (
        <VideoForm
          video={editingVideo}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Video Detail Modal */}
      {showDetail && (
        <VideoDetail
          video={selectedVideo}
          onClose={handleDetailClose}
        />
      )}
    </div>
  );
}
