import "./ListRecent.css";
import React from "react";
const ListTuVung = ({ items }) => {
  return (
    <div>
      <h3 className="list-recent-title">Gần đây</h3>
      <div className="list-recent-container">
        {items.map((item) => (
          <div key={item.id} className="list-recent-item">
            <span className="list-recent-icon">📝</span>
            <span className="list-recent-name">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ListTuVung;
