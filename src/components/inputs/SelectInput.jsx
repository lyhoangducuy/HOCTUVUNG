import React from 'react';

export default function SelectInput({ value, onChange, options = [] }) {
  return (
    <div>
      <select value={value} onChange={onChange}>
        {options.map((item, index) => (
          <option key={index} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
