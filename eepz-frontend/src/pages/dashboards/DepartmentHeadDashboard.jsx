import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/common/Dashboard.css";
const DepartmentHeadDashboard = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const handleNavigation = (path) => {
    navigate(path);
  };
  const cards = [
    {
      title: "Budget Utilization",
      description: "View and update budget utilization for your department",
      icon: "bi bi-pie-chart",
      gradient: "gradient-red",
      path: "/department-head/budget",
    },
    {
      title: "Company Policies",
      description: "View organizational policies",
      icon: "bi bi-shield-check",
      gradient: "gradient-orange",
      path: "/department-head/policies",
    },
    {
      title: "Performance",
      description: "Monitor employee performance across departments",
      icon: "bi bi-graph-up",
      gradient: "gradient-blue",
      path: "/department-head/dashboard/performance",
    },

    {
      title: "SLA Management",
      description: "Service Level Agreement",
      icon: "bi bi-file-earmark-check",
      gradient: "gradient-teal",
      path: "/department-head/dashboard/sla",
    },
    {
      title: "Goals",
      description: "Goal Management",
      icon: "bi bi-bullseye",
      gradient: "gradient-pink",
      path: "/department-head/dashboard/goals",
    },
    {
      title: "Learning and Development",
      description: "Time For An Upgrade",
      icon: "bi bi-book",
      gradient: "gradient-pink",
      path: "/department-head/lnd/dashboard",
    },
    {
      title: "Feedback Management",
      description: "Share Feedbacks",
      icon: "bi bi-chat-left-text",
      gradient: "gradient-teal",
      path: "/department-head/dashboard/feedback",
    },
    {
      title: "Nomination Reviews",
      description: "Review and approve nominations from your team",
      icon: "bi-clipboard-check",
      gradient: "gradient-green",
      path: "/internal/nominations",
    }
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
export default DepartmentHeadDashboard;
