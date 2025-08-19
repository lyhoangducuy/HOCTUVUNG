import { useState, useEffect, useRef } from "react";
import "./SettingAdmin.css";
import { useNavigate } from "react-router-dom";

export default function SettingAdmin() {
  const navigate = useNavigate();
  const [ user,setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullname :  "",
    username : "",
    password : "",
    email: "",
    image : "",
  });
  const[theme , setTheme] = useState('light');
  useEffect (()=>{
    const savedTheme = localStorage.getItem(('theme')) || 'light';
    setTheme(savedTheme);
    document.body.className=savedTheme;
  },[]);
  useEffect(() => {
      try {
        const userData = sessionStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setFormData({
            fullname: parsedUser.fullname ||  "",
            username: parsedUser.username || "",
            password: parsedUser.password || "",
            email: parsedUser.email || "",
            image: parsedUser.image || "",
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
      }
    },[]);

  const fileInputRef = useRef(null);
 
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
   
    document.body.className = newTheme;
  }
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveAccount = () => {
    const userArray= JSON.parse(localStorage.getItem('nguoiDung') || '[]');
    const updateUserArray = userArray.map(prev => {
      if(prev.id ===  user.id){
        return {...prev,...formData};
      }
      return prev;
    })
    localStorage.setItem('nguoiDung',JSON.stringify(updateUserArray))

    if(user){
      const updateUser = {...user, ...formData};
      sessionStorage.setItem('user',JSON.stringify(updateUser))
    }
    alert("Đã luu thành công !")
  };




  const handleLogout = () => {
    sessionStorage.removeItem("user");
    navigate("/");
  };
 const handleAvatarClick =() => {
    fileInputRef.current?.click();
 }
 const handleSaveLayout = () => {
  localStorage.setItem('theme', theme)
 }
const handleImageChange= (e) => {
    const file = e.target.files[0];
    if(file){
      const reader= new FileReader();
        reader.onload = (e) => {
          setFormData((prev) => (
            {
              ...prev, image: e.target.result,
            }
          ))
        }
        reader.readAsDataURL(file);
    }
};
  return (
    <div className="admin-setting-page">
      <h1>Cài đặt hệ thống</h1>
      
      <div className="admin-setting-section">
        <h2>Thông tin tài khoản</h2>
        <div className="user-avatar-section">
          <div className="user-avatar">
            <div className="avatar-placeholder" onClick={handleAvatarClick}>
              {formData.image ? (
                <img src={formData.image} alt="Avatar" className="avatar-image" />
              ): (
                <div className= "avatar-icon">👤</div>
              )}
              <div className="avatar-edit-icon">+</div>
            </div>
          </div>
            <input type="file" 
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{display : "none"}} />

        </div>
        
        <div className="admin-setting-grid">
          <div className="field">
            <label>Họ và tên</label>
            <input 
              type="text" 
              name="fullname"
              value={formData.fullname}
              onChange={handleInputChange}
              placeholder="Nhập tên" 
            />
          </div>
          <div className="field">
            <label>Tên người dùng</label>
            <input 
              type="username" 
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Nhập tên" 
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@domain.com" 
            />
          </div>
          <div className="field">
            <label>Mật khẩu mới</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••" 
            />
          </div>
        </div>
        <button className="btn-save" onClick={handleSaveAccount}>
          Lưu thay đổi
        </button>
      </div>

      <div className="admin-setting-section">
        <h2>Tùy chọn giao diện</h2>
        <div className="admin-setting-grid">
          <div className="field">
            <label>Màu</label>
            <select value={theme} onChange={handleThemeChange} >
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
            </select>
          </div>
          <div className="field">
            <label>Ngôn ngữ</label>
            <select defaultValue="vi">
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <button className="btn-save" onClick={ handleSaveLayout}>
          Lưu giao diện
        </button>
      </div>
      <div>
        <button className="btn-logout" onClick={handleLogout}>Đăng xuất</button>
      </div>
    </div>
  );
}
