// src/components/Admin/Edit/Edit.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./Edit.css";

/**
 * Props chính:
 * - user: object dữ liệu đang chỉnh
 * - onClose(): đóng modal
 * - onSave(payload, isEditFlag?): parent tự đóng khi thành công (component này KHÔNG auto close)
 * - isEditMode: boolean (parent bật bằng cách gọi onSave(user, true))
 * - Colums: [{ name, key, options? }]
 * - showAvatar: boolean
 *
 * Props mở rộng:
 * - readOnlyKeys: string[]
 * - selectFields: { [key]: Array<{value,label}> }
 * - selectLabels: { [key]: (v)=>string }
 *
 * Validate:
 * - validationSchema: Yup schema
 * - validateOnChange: boolean (mặc định false, chỉ validate onBlur + khi bấm Lưu)
 */
const Edit = ({
  user,
  onClose,
  onSave,
  isEditMode = false,
  Colums,
  showAvatar,
  readOnlyKeys = [],
  selectFields = {},
  selectLabels = {},
  validationSchema,       // <-- nhận Yup schema
  validateOnChange = false,
}) => {
  const [formData, setFormData] = useState({ ...user });
  const [errors, setErrors] = useState({}); // { key: "message" }
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData({ ...user });
    setErrors({});
  }, [user]);

  /* ======= helpers ======= */
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

  const handleInputChange = (key) => async (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (validateOnChange) validateField(key, next);
      return next;
    });
  };

  const handleBlur = (key) => async () => {
    await validateField(key, formData);
  };

  const handleSave = async () => {
    const { ok } = await validateAll();
    if (!ok) return; // giữ modal & hiển thị lỗi dưới ô
    onSave(formData); // parent sẽ tự đóng khi cập nhật thành công
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
              const errMsg = errors[key];

              // ROLE
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
                      onBlur={handleBlur(key)}
                      className={`edit-input ${errMsg ? "error" : ""}`}
                    >
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    {errMsg && <div className="field-error">{errMsg}</div>}
                  </div>
                );
              }

              // PASSWORD
              if (key === "password") {
                return (
                  <div key={index} className="info-row">
                    <label>{item.name}</label>
                    {isEditMode && !readOnly ? (
                      <>
                        <input
                          type="password"
                          value={val}
                          onChange={handleInputChange(key)}
                          onBlur={handleBlur(key)}
                          className={`edit-input ${errMsg ? "error" : ""}`}
                        />
                        {errMsg && <div className="field-error">{errMsg}</div>}
                      </>
                    ) : (
                      <span>••••••</span>
                    )}
                  </div>
                );
              }

              // STATUS
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
                      onBlur={handleBlur(key)}
                      className={`edit-input ${errMsg ? "error" : ""}`}
                    >
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    {errMsg && <div className="field-error">{errMsg}</div>}
                  </div>
                );
              }

              // GENERIC SELECT
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
                      onBlur={handleBlur(key)}
                      className={`edit-input ${errMsg ? "error" : ""}`}
                    >
                      <option value="">-- chọn --</option>
                      {providedOpts.map((o) => (
                        <option key={String(o.value)} value={String(o.value)}>
                          {o.label ?? o.value}
                        </option>
                      ))}
                    </select>
                    {errMsg && <div className="field-error">{errMsg}</div>}
                  </div>
                );
              }

              // TEXT INPUT mặc định
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
                    onBlur={handleBlur(key)}
                    className={`edit-input ${errMsg ? "error" : ""}`}
                  />
                  {errMsg && <div className="field-error">{errMsg}</div>}
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
            <button className="btn-edit" onClick={() => onSave(formData, true)}>Chỉnh sửa</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Edit;
