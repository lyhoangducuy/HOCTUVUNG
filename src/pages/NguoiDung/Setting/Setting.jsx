import { useEffect, useState } from "react";
import "./Setting.css";
import { useNavigate } from "react-router-dom";


function Setting() {
    const navigate = useNavigate();
    const [nguoiDung, setNguoiDung] = useState({});
    useEffect(() => {
        if (localStorage.getItem("nguoiDung") === null) {
            navigate("/");
        }
        setNguoiDung(JSON.parse(localStorage.getItem("nguoiDung")));
    }, []);

    // State để bật/tắt chế độ sửa
    const [isEditing, setIsEditing] = useState(false);

    // State để lưu giá trị trong ô input khi sửa
    const [name, setName] = useState(nguoiDung.tenNguoiDung);

    //   const handleSave = () => {
    //     // 1. Ở đây bạn sẽ gọi API để lưu giá trị `name` mới vào database
    //     console.log('Đang lưu tên mới:', name);
    //     // 2. Sau khi lưu thành công, tắt chế độ sửa
    //     setIsEditing(false);
    //     // (Tùy chọn) Cập nhật lại thông tin user trong state toàn cục nếu có
    //   };

    // const handleCancel = () => {
    //     // Hủy bỏ thay đổi, đặt lại giá trị input như ban đầu
    //     setName(nguoiDung.tenNguoiDung);
    //     setIsEditing(false);
    // };

    return (

        <div class="settings-container">
            <h1>Cài đặt</h1>

            <section class="subscription-section">
                <div class="card subscription-card">
                    <button class="btn btn-upgrade1">Nâng cấp tài khoản</button>
                </div>
            </section>

            <section class="personal-info">
                <h2>Thông tin cá nhân</h2>
                <div class="card personal-info-card">
                    <div class="profile-header">
                        <div class="avatars"></div>
                        <div class="change-avatars">&#x21bb;</div>
                    </div>
                    <div class="info-list">
                        <div class="info-item">
                            <div class="info-account">
                                <div class="info-label">Tên người dùng :</div>
                                <div class="info-value">{nguoiDung.tenNguoiDung ? nguoiDung.tenNguoiDung : "whoareyou"}</div>

                            </div>
                            <div class="info-action" onClick={() => setIsEditing(true)}><a href="#" >Sửa</a></div>

                        </div>
                        {
                            isEditing ? (
                                <div>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                                 
                                </div>
                            ) : null
                        }
                        <div class="info-item">
                            <div class="info-account">
                                <div class="info-label">Email :</div>
                                <div class="info-value">{nguoiDung.email ? nguoiDung.email : "whoareyou@gmail.com"}</div>

                            </div>
                            <div class="info-action"><a href="#" onClick={() => setIsEditing(true)}>Sửa</a></div>

                        </div>
                        {
                            isEditing ? (
                                <div>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                                   
                                </div>
                            ) : null
                        }
                        <div class="info-item">
                            <div class="info-account">
                                <div class="info-label">Mật khẩu :</div>
                                <div class="info-value">******************</div>

                            </div>
                            <div class="info-action"onClick={() => setIsEditing(true)}><a href="#" >Sửa</a></div>

                        </div>
                        {
                            isEditing ? (
                                <div>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                                    <button class="btn-fix" onClick={() => setIsEditing(false)}>Huy</button>
                                    <button class="btn-fix" onClick={() => setIsEditing(false)}>Save</button>
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </section>

            <section class="appearance-section">
                <h2>Giao diện</h2>
                <div class="card appearance-card">
                    <div class="setting-item">
                        <span>Hình nền</span>
                        <select>
                            <option>Sáng</option>
                            <option>Tối</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <span>Ngôn ngữ</span>
                        <select>
                            <option>Tiếng Việt</option>
                            <option>English</option>
                        </select>
                    </div>
                </div>
            </section>

            <section class="notifications-section">
                <h2>Thông báo</h2>
                <div class="card notifications-card">
                    <div class="setting-item">
                        <span>Lời nhắc học</span>
                        <label class="toggle-switch">
                            <input type="checkbox" />
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span>Chọn thời điểm nhận lời nhắc</span>
                        <input type="time" value="08:00" />
                    </div>
                </div>
            </section>
            <div class="delete-account">
                <button class="btn btn-danger">Xoá tài khoản</button>
            </div>
        </div>

    );
}

export default Setting;