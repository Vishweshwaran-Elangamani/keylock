import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/common/Dashboard.css";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const handleNavigation = (path) => {
    navigate(path);
  };
  const cards = [
    {
      title: "User Management",
      description: "Manage user accounts and permissions",
      icon: "bi-people",
      gradient: "gradient-blue",
      path: "/admin/users",
    },
    {
      title: "Role Management",
      description: "Configure roles and access levels",
      icon: "bi-shield-lock",
      gradient: "gradient-blue",
      path: "/admin/roles",
    },
    {
      title: "Department Management",
      description: "Manage departments and budgets",
      icon: "bi-building",
      gradient: "gradient-blue",
      path: "/admin/departments",
    },
    {
      title: "Change Requests",
      description: "Review employee change requests",
      icon: "bi-clipboard-check",
      gradient: "gradient-blue",
      path: "/admin/change-requests",
    },
  ];
  return (
    <div className="dashboard-container">
      <div className="management-cards-grid">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`management-card ${
              hoveredCard === index ? "hovered" : ""
            }`}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleNavigation(card.path)}
          >
            <div className={`card-icon-wrapper ${card.gradient}`}>
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="card-content">
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
            </div>
            <div className="card-arrow">
              <i className="bi bi-arrow-right"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminDashboard;
