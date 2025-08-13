const ListBoThe = ({ items }) => {
  return (
    <div style={{ marginTop: 32 }}>
      <h3>Bộ thẻ phổ biến</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#eef2ff",
              borderRadius: 12,
              boxShadow: "0 2px 8px #eee",
              padding: 16,
              minWidth: 220,
              margin: 8,
            }}
          >
            <div style={{ fontWeight: 600 }}>{item.name}</div>
            <div style={{ color: "#888" }}>{item.terms} terms</div>
            <div
              style={{ display: "flex", alignItems: "center", marginTop: 8 }}
            >
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="avatar"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  marginRight: 8,
                }}
              />
              <span style={{ color: "#444" }}>{item.author}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ListBoThe;
