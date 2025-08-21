import "./Landingpage.css"
import { useNavigate } from "react-router-dom";

export default function Landingpage() {
    const navigate = useNavigate();

    const handleScrollLeft = () => {
        const featuresGrid = document.querySelector('.features-grid');
        featuresGrid.scrollLeft -= featuresGrid.offsetWidth;
    };

    const handleScrollRight = () => {
        const featuresGrid = document.querySelector('.features-grid');
        featuresGrid.scrollLeft += featuresGrid.offsetWidth;
    };

    return (
        <div className="container">

            {/* Hero section */}
            <section className="hero-section">
                <h1>Bạn muốn học từ mới như thế nào ?</h1>
                <p>
                    Học mọi lúc với H bằng nhiều hình thức khác nhau như: 
                    Thẻ ghi nhớ (Flashcards), Trắc nghiệm, Bài kiểm tra, Học bằng video.
                </p>
                <div className="cta-buttons">
                    <button className="btn-primary" onClick={() => navigate("/dang-ky")}>Đăng ký miễn phí</button>
                    <a href="#" className="link-secondary" onClick={() => navigate("/dang-ky")}>Tôi là giảng viên</a>
                </div>
            </section>

            {/* Features section */}
            <section className="features-section">
                <button className="slider-arrow arrow-left" onClick={handleScrollLeft}>&lsaquo;</button>

                <div className="features-grid">
                    <div className="feature-card card-blue">
                        <h3>Thẻ ghi nhớ</h3>
                        <p style={{ color: "white" }}>
                            Thẻ ghi nhớ của các bộ thẻ được giảng viên tổng hợp và sắp xếp hợp lý
                        </p>
                    </div>
                    <div className="feature-card card-orange">
                        <h3>Trắc nghiệm</h3>
                        <p>
                            Các câu hỏi trắc nghiệm cơ bản cho từng bộ thẻ giúp bạn luyện tập tăng cường ghi nhớ
                        </p>
                    </div>
                    <div className="feature-card card-green">
                        <h3>Bài kiểm tra</h3>
                        <p>
                            Thử thách các bài kiểm tra để tự đánh giá bản thân
                        </p>
                    </div>
                    <div className="feature-card card-lightblue">
                        <h3>Học bằng video</h3>
                        <p>Xem các ví dụ bằng video và trả lời một cách hợp lý</p>
                    </div>
                    <div className="feature-card card-pink">
                        <h3>Nhiều học phần tổng hợp</h3>
                        <p>
                            Các học phần tổng hợp nhiều bộ thẻ cùng chủ đề cho học viên sử dụng
                        </p>
                    </div>
                    <div className="feature-card card-yellow">
                        <h3>Trò chơi ghép nối</h3>
                        <p>Giải trí và thử thách trí nhớ với trò chơi nối thẻ</p>
                    </div>
                </div>

                <button className="slider-arrow arrow-right" onClick={handleScrollRight}>&rsaquo;</button>
            </section>

            {/* AI Support section */}
            <section className="ai-section">
                <h2>AI Hỗ Trợ Học Tập</h2>
                <p>
                    Hệ thống được tích hợp AI giúp bạn học tập thông minh và nhanh chóng hơn
                </p>
            </section>
        </div>
    );
}
