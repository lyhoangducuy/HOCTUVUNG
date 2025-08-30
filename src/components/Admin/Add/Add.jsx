// src/components/Admin/Add/Add.jsx
import React, { useRef, useState, useCallback } from "react";
import "./Add.css";

/**
 * Props:
 * - onClose()
 * - onSave(payload)  // parent tự đóng khi thành công
 * - Colums: [{ name, key, options? }]
 * - showAvatar: boolean
 * - validationSchema: Yup schema
 * - validateOnChange: boolean
 */
const Add = ({
  onClose,
  onSave,
  Colums,
  showAvatar,
  validationSchema,
  validateOnChange = false,
}) => {
  const initial = Colums.reduce((acc, item) => {
    acc[item.key] = "";
    return acc;
  }, {});
  const [formData, setFormData] = useState({
    ...initial,
    created: new Date().toLocaleDateString("vi-VN"),
  });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  /* ---------- validate helpers ---------- */
  const setFieldError = (key, message) =>
    setErrors((prev) => ({ ...prev, [key]: message || "" }));

  const clearFieldError = (key) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const validateField = useCallback(
    async (key, data) => {
      if (!validationSchema || !validationSchema.validateAt) return;
      try {
        await validationSchema.validateAt(key, data);
        clearFieldError(key);
      } catch (err) {
        setFieldError(key, err?.message || "Giá trị không hợp lệ");
      }
    },
    [validationSchema]
  );

  const validateAll = useCallback(async () => {
    if (!validationSchema) return { ok: true };
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return { ok: true };
    } catch (err) {
      if (err?.name === "ValidationError") {
        const map = {};
        for (const e of err.inner || []) {
          if (e.path && !map[e.path]) map[e.path] = e.message;
        }
        setErrors(map);
      }
      return { ok: false };
    }
  }, [validationSchema, formData]);

  /* ---------- handlers ---------- */
  const handleInputChange = (key) => (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (validateOnChange) validateField(key, next);
      return next;
    });
  };

  const handleBlur = (key) => () => validateField(key, formData);

  const handleEnterSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = async () => {
    const { ok } = await validateAll();
    if (!ok) return;
    onSave(formData);
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

  const handleAvatarClick = () => fileInputRef.current?.click();

  return (
    <div className="user-detail-modal-overlay">
      <div className="user-detail-modal" onKeyDown={handleEnterSubmit}>
        <div className="user-detail-modal-header">
          <h2>Thêm mới</h2>
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
              const key = item.key;
              const val = formData[key] ?? "";
              const errMsg = errors[key];
              const errId = `err-${key}`;

              // SELECT nếu có options
              if (Array.isArray(item.options)) {
                return (
                  <div key={index} className="info-row">
                    <label htmlFor={key}>{item.name}</label>
                    <div className="input-col">
                      <select
                        id={key}
                        value={val}
                        onChange={handleInputChange(key)}
                        onBlur={handleBlur(key)}
                        aria-invalid={!!errMsg}
                        aria-describedby={errMsg ? errId : undefined}
                        className={`edit-input ${errMsg ? "error" : ""}`}
                      >
                        <option value="">-- chọn --</option>
                        {item.options.map((o) => (
                          <option key={String(o.value)} value={String(o.value)}>
                            {o.label ?? o.value}
                          </option>
                        ))}
                      </select>
                      {errMsg && (
                        <div id={errId} className="field-error">
                          {errMsg}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // INPUT text mặc định
              if (key !== "created" && key !== "image" && key !== "id") {
                return (
                  <div key={index} className="info-row">
                    <label htmlFor={key}>{item.name}</label>
                    <div className="input-col">
                      <input
                        id={key}
                        type="text"
                        value={val}
                        onChange={handleInputChange(key)}
                        onBlur={handleBlur(key)}
                        aria-invalid={!!errMsg}
                        aria-describedby={errMsg ? errId : undefined}
                        className={`edit-input ${errMsg ? "error" : ""}`}
                        placeholder={`Nhập ${item.name.toLowerCase()}`}
                      />
                      {errMsg && (
                        <div id={errId} className="field-error">
                          {errMsg}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        <div className="user-detail-modal-actions">
          <button className="btn-cancel" onClick={onClose}>Hủy</button>
          <button className="btn-save" onClick={handleSave}>Thêm</button>
        </div>
      </div>
    </div>
  );
};

export default Add;
