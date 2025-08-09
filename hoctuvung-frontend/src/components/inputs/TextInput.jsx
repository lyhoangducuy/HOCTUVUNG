import React from "react";
import "./TextInput.css";

export default function TextInput({ type = "text", value, onChange, placeholder }) {
  return (
    <div className="ti">
      <input
        className="ti-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
