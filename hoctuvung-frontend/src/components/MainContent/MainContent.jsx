import React, { useState } from "react";
import ListTuVung from "./ListTuvung/ListTuVung";
import ListBoThe from "./ListBoThe/ListBoThe";
const MainContent = () => {
  const [recentItems, setRecentItems] = useState([
    { id: 1, name: "Từ vựng buổi 1" },
    { id: 2, name: "Từ vựng buổi 2" },
    { id: 3, name: "Từ vựng buổi 3" },
    { id: 4, name: "Từ vựng buổi 4" },
    { id: 5, name: "Từ vựng buổi 5" },
  ]);
  const [popularItems, setPopularItems] = useState([
    { id: 1, name: "Từ vựng Tiếng Nhật", terms: 147, author: "Huỳnh Nguyễn" },
    { id: 2, name: "Từ vựng Tiếng Nhật", terms: 147, author: "Huỳnh Nguyễn" },
    { id: 3, name: "Từ vựng Tiếng Nhật", terms: 147, author: "Huỳnh Nguyễn" },
    { id: 4, name: "Từ vựng Tiếng Nhật", terms: 147, author: "Huỳnh Nguyễn" },
    { id: 5, name: "Từ vựng Tiếng Nhật", terms: 147, author: "Huỳnh Nguyễn" },
  ]);
  return (
    <div className="container ">
      {<ListTuVung items={recentItems} />}
      {<ListBoThe items={popularItems} />}
    </div>
  );
};
export default MainContent;
