import { useEffect, useState } from "react";
import "./Search.css";
const Search = ({ Data, onResult }) => {
  const [search, setSearch] = useState("");
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  useEffect(() => {
    const filteredData = Data.filter((item) =>
      (item.name || item.username).toLowerCase().includes(search.toLowerCase())
    );
    onResult(filteredData);
  }, [search]);
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
