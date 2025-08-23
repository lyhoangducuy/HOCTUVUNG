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
  const [formData, setFormData] = useState({ ...user });
  const fileInputRef = useRef(null);

  const handleInputChange = (key) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData((prev) => ({ ...prev, image: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    if (isEditMode) fileInputRef.current?.click();
  };

  // ===== Helpers cho select mặc định =====
  const defaultRoleOptions = [
    { value: "HOC_VIEN", label: "Học viên" },
    { value: "GIANG_VIEN", label: "Giảng viên" },
    { value: "ADMIN", label: "Admin" },
  ];
  const defaultStatusOptions = [
    { value: "Đang hoạt động", label: "Đang hoạt động" },
    { value: "Hết hạn", label: "Hết hạn" },
    { value: "Đã hủy", label: "Đã hủy" },
  ];

  return (
    <div className="user-detail-modal-overlay">
      <div className="user-detail-modal">
        <div className="user-detail-modal-header">
          <h2>Thông tin chi tiết</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="user-detail-modal-content">
          {showAvatar && (
            <div className="user-avatar-section">
              <div className="user-avatar">
                <div className="avatar-placeholder" onClick={handleAvatarClick}>
                  {formData.image ? (
                    <img src={formData.image} alt="Avatar" className="avatar-image" />
                  ) : (
                    <div className="avatar-icon">👤</div>
                  )}
                </div>
                {isEditMode && <div className="avatar-edit-icon">+</div>}
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
              if (/^id/i.test(item.key)) {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    <span>{formData[item.key]}</span>
                  </div>
                );
              }
              else if (item.key === "role") {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    {isEditMode ? (
                      <select
                        value={val}
                        onChange={handleInputChange(item.key)}
                        className="edit-input"
                      >
                        {opts.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{val}</span>
                    )}
                  </div>
                );
              } 
              else if (item.key === "password") {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    {isEditMode ? (
                      <input
                        type="password"
                        value={val}
                        onChange={handleInputChange(item.key)}
                        className="edit-input"
                      />
                    ) : (
                      <span>••••••</span>
                    )}
                  </div>
                );
              }

              // 3) STATUS: nếu có options thì dùng; nếu không thì dùng mặc định
              if (item.key === "status") {
                const opts = Array.isArray(item.options) ? item.options : defaultStatusOptions;
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    {isEditMode ? (
                      <select
                        value={val}
                        onChange={handleInputChange(item.key)}
                        className="edit-input"
                      >
                        {opts.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{val}</span>
                    )}
                  </div>
                );
              }

              // 4) GENERIC SELECT: nếu cột có item.options => render <select>
              if (Array.isArray(item.options)) {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    {isEditMode ? (
                      <select
                        value={val}
                        onChange={handleInputChange(item.key)}
                        className="edit-input"
                      >
                        <option value="">-- chọn --</option>
                        {item.options.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      // hiển thị label tương ứng khi ở chế độ xem
                      <span>
                        {(() => {
                          const found = item.options.find((o) => String(o.value) === String(val));
                          return found ? found.label : val;
                        })()}
                      </span>
                    )}
                  </div>
                );
              }

              // 5) Mặc định: input text như cũ
              return (
                <div key={index} className="info-row">
                  <label>{item.name}</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={val}
                      onChange={handleInputChange(item.key)}
                      className="edit-input"
                    />
                  ) : (
                    <span>{val}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="user-detail-modal-actions">
          <button className="btn-cancel" onClick={onClose}>Đóng</button>
          {isEditMode ? (
            <button className="btn-save" onClick={handleSave}>Lưu</button>
          ) : (
            <button className="btn-edit" onClick={() => onSave(user, true)}>Chỉnh sửa</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Edit;
