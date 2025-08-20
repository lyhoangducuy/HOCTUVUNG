import "./Landingpage.css"
import { useNavigate } from "react-router-dom";
export default function landingpage() {
    const navigate = useNavigate();
    const handleScrollLeft = () => {
        const featuresGrid = document.querySelector('.features-grid');
        featuresGrid.scrollLeft -= featuresGrid.offsetWidth;
    }

    const handleScrollRight = () => {
        const featuresGrid = document.querySelector('.features-grid');
        featuresGrid.scrollLeft += featuresGrid.offsetWidth;
    }
    return (
        <div class="container">

            <section class="hero-section">
                <h1>Bạn muốn học từ mới như thế nào ?</h1>
                <p>Học mọi lúc với H bằng nhiều hình thức khác nhau như : Thẻ ghi nhớ(Flashcards), Trắc nghiệm, Bài kiểm tra, Học bằng video</p>
                <div class="cta-buttons">
                    <button class="btn-primary" onClick={() => navigate("/dang-ky")}>Đăng ký miễn phí</button>
                    <a href="#" class="link-secondary" onClick={() => navigate("/dang-ky")}>Tôi là giảng viên</a>
                </div>
            </section>

            <section class="features-section">
                <button class="slider-arrow arrow-left" onClick={handleScrollLeft}>&lsaquo;</button>

                <div class="features-grid">
                    <div class="feature-card card-blue">
                        <h3>Thẻ ghi nhớ</h3>
                        <p style={{ color: "white" }}>Thẻ ghi nhở của các bộ thẻ được các giảng viên tổng hợp và sắp xếp hợp lý</p>
                    </div>
                    <div class="feature-card card-orange">
                        <h3>Trắc nghiệm</h3>
                        <p>Các câu hỏi trắc nghiệm hợp lý, cơ bản cho từng bộ thẻ giúp bạn luyện tập tăng cường ghi nhớ</p>
                    </div>
                    <div class="feature-card card-green">
                        <h3>Bài kiểm tra</h3>
                        <p>Thử thách các bài kiểm tra của các bộ thẻ để tự đánh giá bản thân</p>
                        <p></p>
                    </div>
                    <div class="feature-card card-lightblue">
                        <h3>Học bằng video</h3>
                        <p>Xem các ví dụ bằng video và trả lời một cách hợp lý</p>
                    </div>
                    <div class="feature-card card-pink">
                        <h3>Nhiều học phần tổng hợp</h3>
                        <p>Các học phẩn tổng hợp các bộ thẻ cùng chủ đề cho các học viên sử dụng</p>
                    </div>
                    <div class="feature-card card-yellow">
                        <h3>Trò chơi ghép nối</h3>
                        <p>Giải trí bằng cách thử thách trí nhớ với trò chơi nối thẻ</p>
                    </div>
                </div>

                <button class="slider-arrow arrow-right" onClick={handleScrollRight}>&rsaquo;</button>
            </section>

        </div>
    );
}