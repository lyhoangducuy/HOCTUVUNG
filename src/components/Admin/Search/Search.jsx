import { useEffect, useState } from "react";
import "./Search.css";
const Search = ({ Data, onResult }) => {
  const [search, setSearch] = useState("");
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  useEffect(() => {
    const term = search.trim().toLowerCase();
    const filteredData = (Array.isArray(Data) ? Data : []).filter((item) => {
      const haystack = `${item.username || ""} ${item.fullname || ""} ${item.email || ""}`.toLowerCase();
      return haystack.includes(term);
    });
    onResult(filteredData);
  }, [search, Data, onResult]);
  return (
    <input
      className="search-input"
      placeholder="Tìm kiếm"
      value={search}
      onChange={handleSearchChange}
    />
  );
};

export default Search;
