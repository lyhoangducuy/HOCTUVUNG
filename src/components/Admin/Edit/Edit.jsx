import React, { useState, useRef } from "react";
import "./Edit.css";

const Edit = ({
  user,
  onClose,
  onSave,
  isEditMode = false,
  Colums,
  showAvatar,
}) => {
  const [formData, setFormData] = useState({
    ...user,
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
    onSave(formData);
    onClose();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("File selected:", file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("Image loaded successfully");
        setFormData((prev) => ({
          ...prev,
          image: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    if (isEditMode) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="user-detail-modal-overlay">
      <div className="user-detail-modal">
        <div className="user-detail-modal-header">
          <h2>Thông tin chi tiết</h2>
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
                  {isEditMode && <div className="avatar-edit-icon">+</div>}
                </div>
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
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    {isEditMode ? (
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
                    ) : (
                      <span>{formData[item.key]}</span>
                    )}
                  </div>
                );
              } else if (item.key === "password") {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    {isEditMode ? (
                      <input
                        type="password"
                        name={item.key}
                        value={formData[item.key]}
                        onChange={handleInputChange(item.key)}
                        className="edit-input"
                      />
                    ) : (
                      <span>••••••</span>
                    )}
                  </div>
                );
              }  else if (item.key==="status"){
                return (
                  <div key={index} className="info-row">
                      <label>{item.name}</label>
                      {isEditMode ? (
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
                      ):(
                        <span>{formData[item.key]}</span>
                      )}

                  </div>
                )

              }
            else {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name={item.key}
                        value={formData[item.key]}
                        onChange={handleInputChange(item.key)}
                        className="edit-input"
                      />
                    ) : (
                      <span>{formData[item.key]}</span>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>
        <div className="user-detail-modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Đóng
          </button>
          {isEditMode ? (
            <button className="btn-save" onClick={handleSave}>
              Lưu
            </button>
          ) : (
            <button className="btn-edit" onClick={() => onSave(user, true)}>
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Edit;
