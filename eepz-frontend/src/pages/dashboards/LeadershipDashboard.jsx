import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/common/Dashboard.css";
const LeadershipDashboard = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const handleNavigation = (path) => {
    navigate(path);
  };
  const cards = [
    {
      title: "Budget Management",
      description: "Create and manage departmental budgets by fiscal year",
      icon: "bi-cash-coin",
      gradient: "gradient-red",
      path: "/leadership/budget-management",
    },
    // {
    //   title: "Career Progression",
    //   description: "Approve promotions submitted by HR with salary details",
    //   icon: "bi-check-circle",
    //   gradient: "gradient-blue",
    //   path: "/leadership/promotions",
    // },
    {
      title: "Company Policies",
      description: "View organizational policies",
      icon: "bi-shield-check",
      gradient: "gradient-orange",
      path: "/leadership/policies",
    },
    {
      title: "Goals",
      description: "Goal Management",
      icon: "bi bi-bullseye",
      gradient: "gradient-pink",
      path: "/leadership/dashboard/goals",
    },
    {
      title: "Learning and Development",
      description: "Time For An Upgrade",
      icon: "bi bi-book",
      gradient: "gradient-pink",
      path: "/leadership/lnd/dashboard",
    },
  ];
  return (
    <div className="dashboard-container">
      {/* Main Content Grid */}
      <div className="main-content-grid">
        {/* Left Column - Management Cards */}
        <div className="left-column">
          <div className="section-header"></div>
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
      </div>
    </div>
  );
};
export default LeadershipDashboard;
