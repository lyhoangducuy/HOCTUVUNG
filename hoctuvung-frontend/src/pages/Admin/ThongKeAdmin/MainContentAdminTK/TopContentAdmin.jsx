import "./TopContent.css";
const TopContentAdmin = (props) => {
  const { userStats } = props;
  return (
    <div className="admin-layout-content">
      {userStats.map((stat) => (
        <div
          key={stat.id}
          className={`stat-item ${stat.value > 10 ? "green" : "red"}`}
        >
          <h2>{stat.name}</h2>
          <p>{stat.value}</p>
          <span>{stat.title}</span>
        </div>
      ))}
    </div>
  );
};

export default TopContentAdmin;
