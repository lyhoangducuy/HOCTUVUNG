import React, { useState, useRef, useEffect } from "react";
import "./Edit.css";

const Edit = ({
  user,
  onClose,
  onSave,
  isEditMode = false,
  Colums,
  showAvatar,

  // ====== props mở rộng (tất cả đều optional, không ảnh hưởng chỗ cũ) ======
  readOnlyKeys = [],                   // ví dụ: ["id", "created", "memberCount", "cardCount"]
  selectFields = {},                   // ví dụ: { userCreated: [{value:"1",label:"Admin 1"}] }
  selectLabels = {},                   // ví dụ: { userCreated: (v)=>`ID ${v}` }
}) => {
  const [formData, setFormData] = useState({ ...user });
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData({ ...user });
  }, [user]);

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

  // ===== Helpers mặc định cho một số field phổ biến =====
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

  // lấy label hiển thị từ options/mapper
  const getLabelFromOptions = (key, value, opts) => {
    if (typeof selectLabels[key] === "function") return selectLabels[key](value);
    if (Array.isArray(opts)) {
      const found = opts.find((o) => String(o.value) === String(value));
      if (found) return found.label ?? found.value;
    }
    return value ?? "";
  };

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
              const key = item.key;
              const val = formData[key] ?? "";
              const readOnly = readOnlyKeys.includes(key);

              // ===== 1) ROLE: ưu tiên item.options, fallback defaultRoleOptions
              if (key === "role") {
                const opts = Array.isArray(item.options) ? item.options : defaultRoleOptions;
                if (!isEditMode || readOnly) {
                  return (
                    <div key={index} className="info-row">
                      <label>{item.name}</label>
                      <span>{getLabelFromOptions(key, val, opts)}</span>
                    </div>
                  );
                }
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    <select
                      value={val}
                      onChange={handleInputChange(key)}
                      className="edit-input"
                    >
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              // ===== 2) PASSWORD: giữ nguyên hành vi
              if (key === "password") {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    {isEditMode && !readOnly ? (
                      <input
                        type="password"
                        value={val}
                        onChange={handleInputChange(key)}
                        className="edit-input"
                      />
                    ) : (
                      <span>••••••</span>
                    )}
                  </div>
                );
              }

              // ===== 3) STATUS: ưu tiên item.options, fallback defaultStatusOptions
              if (key === "status") {
                const opts = Array.isArray(item.options) ? item.options : defaultStatusOptions;
                if (!isEditMode || readOnly) {
                  return (
                    <div key={index} className="info-row">
                      <label>{item.name}</label>
                      <span>{getLabelFromOptions(key, val, opts)}</span>
                    </div>
                  );
                }
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    <select
                      value={val}
                      onChange={handleInputChange(key)}
                      className="edit-input"
                    >
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              // ===== 4) GENERIC SELECT:
              // - nếu Colums cung cấp item.options => dùng
              // - else nếu selectFields prop có options cho key => dùng
              const providedOpts = Array.isArray(item.options)
                ? item.options
                : Array.isArray(selectFields[key])
                ? selectFields[key]
                : null;

              if (providedOpts) {
                if (!isEditMode || readOnly) {
                  return (
                    <div key={index} className="info-row">
                      <label>{item.name}</label>
                      <span>{getLabelFromOptions(key, val, providedOpts)}</span>
                    </div>
                  );
                }
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    <select
                      value={val}
                      onChange={handleInputChange(key)}
                      className="edit-input"
                    >
                      <option value="">-- chọn --</option>
                      {providedOpts.map((o) => (
                        <option key={String(o.value)} value={String(o.value)}>
                          {o.label ?? o.value}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              // ===== 5) Text input mặc định (tôn trọng readOnlyKeys)
              if (!isEditMode || readOnly) {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    <span>{val}</span>
                  </div>
                );
              }

              return (
                <div key={index} className="info-row">
                  <label>{item.name}</label>
                  <input
                    type="text"
                    value={val}
                    onChange={handleInputChange(key)}
                    className="edit-input"
                  />
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
