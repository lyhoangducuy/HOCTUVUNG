import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VideoLibrary() {
  const [lessons, setLessons] = useState([
    {
      id: "ls1",
      tenBoThe: "Luyện nghe mẫu (mp4)",
      moTa: "Video nội bộ",
      video: {
        src: "/src/assets/video/video.mp4",
        transcript: [
          { t: 2, answers: "What are you doing today" },
          { t: 5, answers: "I'm working at the National Railway Museum" },
          { t: 7, answers: "Well we've been to a hotel for the night" },
          { t: 11, answers: "As a birthday present from our youngest son, to his mum" },
          
        ],
      },
    },
    {
      id: "ls2",
      tenBoThe: "Luyện nghe mẫu (mp4)",
      moTa: "Video nội bộ",
      video: {
        src: "/src/assets/video/video.mp4",
        transcript: [
           { t: 2, answers: "What are you doing today" },
          { t: 5, answers: "I'm working at the National Railway Museum" },
          { t: 7, answers: "Well we've been to a hotel for the night" },
          { t: 11, answers: "As a birthday present from our youngest son, to his mum" },
        ],
      },
    },
    {
      id: "ls3",
      tenBoThe: "Luyện nghe mẫu (mp4)",
      moTa: "Video nội bộ",
      video: {
        src: "/src/assets/video/video.mp4",
        transcript: [
            { t: 2, answers: "What are you doing today" },
          { t: 5, answers: "I'm working at the National Railway Museum" },
          { t: 7, answers: "Well we've been to a hotel for the night" },
          { t: 11, answers: "As a birthday present from our youngest son, to his mum" },
        ],
      },
    },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("lessonList",JSON.stringify(lessons));
  }, []);

  const openLesson = (lesson) => {
    localStorage.setItem("selected", JSON.stringify(lesson));
    navigate(`/video/${lesson.id}`);
  };

  return (
    <div className="video-page" style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Thư viện bài học video</h2>
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
    </div>
  );
}
