import React, { useState, useRef } from "react";
import "./Add.css";

const Add = ({ onClose, onSave, Colums, showAvatar }) => {
  const [formData, setFormData] = useState(() => {
    const temp = Colums.reduce((acc, item) => {
      acc[item.key] = "";
      return acc;
    }, {});

    return {
      ...temp,
      created: new Date().toLocaleDateString("vi-VN"),
    };
  });

  const fileInputRef = useRef(null);

  const handleInputChange = (key) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    const newUser = formData;
    onSave(newUser);
    onClose();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          image: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="user-detail-modal-overlay">
      <div className="user-detail-modal">
        <div className="user-detail-modal-header">
          <h2>Thêm mới</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="user-detail-modal-content">
          {showAvatar && (
            <div className="user-avatar-section">
              <div className="user-avatar">
                <div className="avatar-placeholder" onClick={handleAvatarClick}>
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Avatar"
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-icon">👤</div>
                  )}
                  
                </div>
                <div className="avatar-edit-icon">+</div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>
          )}

          <div className="user-info-section">
            {Colums.map((item, index) => {
              if (item.key === "role") {
                return (
                  <div key={item.key} className="info-row">
                    <label>{item.name}</label>
                    <select
                      name="role"
                      value={formData[item.key]}
                      onChange={handleInputChange(item.key)}
                      className="edit-input"
                    >
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                );
              } else if (item.key === "password") {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    <input
                      type="password"
                      name={item.key}
                      value={formData[item.key]}
                      onChange={handleInputChange(item.key)}
                      className="edit-input"
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                );
              }  else if (item.key==="status"){
                return (
                  <div key={index} className="info-row">
                      <label>{item.name}</label>
                     
                          <select 
                          name="stastus"
                          value={formData[item.key]}
                          onChange={handleInputChange(item.key)}
                          className="edit-input"
                          >
                            <option value="Đang hoạt động">Đang hoạt động</option>
                            <option value="Hết hạn">Hết hạn</option>
                            <option value="Đã hủy">Đã hủy</option>

                          </select>
                     

                  </div>
                )

              }
              else if (
                item.key !== "created" &&
                item.key !== "image" &&
                item.key !== "id"
              ) {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    <input
                      type="text"
                      name={item.key}
                      value={formData[item.key]}
                      onChange={handleInputChange(item.key)}
                      className="edit-input"
                      placeholder={`Nhập ${item.name.toLowerCase()}`}
                    />
                  </div>
                );
              }
            })}
          </div>
        </div>

        <div className="user-detail-modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-save" onClick={handleSave}>
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Add;
