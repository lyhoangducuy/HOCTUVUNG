import React from "react";
import "./Delete.css";

const DeleteDialog = ({ id, onClose, onConfirm, message }) => {
  return (
    <div className="delete-dialog-overlay">
      <div className="delete-dialog">
        <div className="delete-dialog-header">
          <span className="delete-dialog-title">
            {message || "Bạn Có Muốn Xóa Dữ Liệu Này Không"}
          </span>
          <button className="delete-dialog-close" onClick={onClose}>X</button>
        </div>
        <div className="delete-dialog-actions">
          <button className="delete-dialog-btn-cancel" onClick={onClose}>
            Không
          </button>
          <button
            className="delete-dialog-btn-confirm"
            onClick={() => onConfirm(id)}
          >
            Có
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDialog;
