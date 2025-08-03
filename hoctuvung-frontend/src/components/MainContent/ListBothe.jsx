import "./ListBothe.css";

const ListBoThe = ({ items }) => {
  return (
    <div className="list-bothe-wrapper">
      <h3 className="list-bothe-title">Bộ thẻ phổ biến</h3>
      <div className="list-bothe-container">
        {items.map((item) => (
          <div key={item.id} className="list-bothe-item">
            <div className="list-bothe-name">{item.name}</div>
            <div className="list-bothe-terms">{item.terms} terms</div>
            <div className="list-bothe-author">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="avatar"
                className="list-bothe-avatar"
              />
              <span>{item.author}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ListBoThe;
