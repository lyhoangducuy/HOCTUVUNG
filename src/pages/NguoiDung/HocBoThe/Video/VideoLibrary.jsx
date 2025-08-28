import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllVideos } from "../../../../services/videoService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
export default function VideoLibrary() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [hienDropdown, setHienDropdown] = useState(false);
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await getAllVideos();
      setLessons(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách video:", error);
      // Fallback to empty array if Firebase fails
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const openLesson = (lesson) => {
    navigate(`/video/${lesson.id}`);
  };

  if (loading) {
    return (
      <div className="video-page" style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 12 }}>Thư viện bài học video</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Đang tải danh sách video...</p>
        </div>
      </div>
    );
  }
  const doiTrangThaiDropdown = () => setHienDropdown((prev) => !prev);
  return (
    <div className="video-page" style={{ padding: 16 }}>
      <div className="video-page-head" style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ marginBottom: 12 }}>Thư viện bài học video</h2>
        <div style={{ position: "relative" }}>
                <button className="btn-them" onClick={doiTrangThaiDropdown}>
                  <FontAwesomeIcon icon={faPlus} className="icon" />
                </button>
                {hienDropdown && (
                  <div className="dropdown-menu" style={{marginTop : "-30px"}}>
                    <button onClick={() => { setHienDropdown(false); navigate("/videoupload"); }}>
                      Thêm bài học video
                    </button>
                  </div>
                )}
          </div>
      </div>
      {lessons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
          <h3 style={{ marginBottom: '8px', color: '#374151' }}>Chưa có video nào</h3>
          <p style={{ color: '#6b7280' }}>Hãy liên hệ admin để thêm video mới</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
        {lessons.map((ls) => (
          <div
            key={ls.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 700 }}>{ls.tenBoThe}</div>
            <div style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>
              {ls.moTa || "Bài học video"}
            </div>
            <button
              onClick={() => openLesson(ls)}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "8px 10px",
                background: "#111827",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Học ngay
            </button>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
